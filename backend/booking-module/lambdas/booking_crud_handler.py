import json
import boto3
import os
import uuid
import logging
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB setup
dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])

# Log table names for debugging
logger.info(f"BOOKINGS_TABLE: {os.environ.get('BOOKINGS_TABLE')}")
logger.info(f"BIKES_TABLE: {os.environ.get('BIKES_TABLE')}")

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    method = event["requestContext"]["http"].get("method")
    path = event["rawPath"]
    path_params = event.get("pathParameters") or {}

    try:
        # GET /bookings - Get user's bookings
        if method == "GET" and path == "/bookings":
            return get_user_bookings(event)

        # POST /bookings - Create new booking
        if method == "POST" and path == "/bookings":
            return create_booking(event)

        # DELETE /bookings/{bookingId} - Cancel booking
        if method == "DELETE" and path.startswith("/bookings/"):
            return cancel_booking(path_params.get("bookingId"), event)

        # GET /available-vehicles - Get available vehicles
        if method == "GET" and path == "/available-vehicles":
            return get_available_vehicles(event)

        return respond(400, {"message": "Invalid route or method."})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return respond(500, {"error": str(e)})

def get_user_id(event):
    """Simple JWT user ID extraction"""
    try:
        claims = event['requestContext']['authorizer']['claims']
        return claims.get('sub')
    except:
        logger.error("Failed to extract user ID from JWT")
        return None

def get_user_bookings(event):
    """Get user's bookings with simple scan approach"""
    try:
        user_id = get_user_id(event)
        if not user_id:
            return respond(401, {"error": "Invalid or missing user authentication"})

        # Simple scan with Python filtering (like bike CRUD)
        response = bookings_table.scan()
        user_bookings = [item for item in response['Items'] if item.get('userId') == user_id]
        
        # Apply filters if provided
        query_params = event.get('queryStringParameters', {}) or {}
        status_filter = query_params.get('status')
        date_filter = query_params.get('date')
        
        if status_filter:
            user_bookings = [b for b in user_bookings if b.get('status') == status_filter]
        
        if date_filter:
            user_bookings = [b for b in user_bookings if b.get('bookingDate') == date_filter]

        logger.info(f"Retrieved {len(user_bookings)} bookings for user {user_id}")
        
        return respond(200, {
            'bookings': user_bookings,
            'count': len(user_bookings)
        })
        
    except Exception as e:
        logger.error(f"Error retrieving user bookings: {str(e)}")
        return respond(500, {"error": "Failed to retrieve bookings"})

def create_booking(event):
    """Create a new booking"""
    try:
        user_id = get_user_id(event)
        if not user_id:
            return respond(401, {"error": "Invalid or missing user authentication"})

        body = json.loads(event["body"])
        
        # Extract booking details
        bike_id = body.get('bikeId')
        booking_date = body.get('bookingDate')
        start_time = body.get('startTime')
        end_time = body.get('endTime')
        pickup_location = body.get('pickupLocation')

        # Validate required fields
        if not all([bike_id, booking_date, start_time, end_time, pickup_location]):
            return respond(400, {"error": "Missing required fields"})

        # Check if bike exists
        bike_response = bikes_table.get_item(Key={'bikeId': bike_id})
        if 'Item' not in bike_response:
            return respond(404, {"error": "Vehicle not found"})

        bike = bike_response['Item']

        # Check for booking conflicts (simple approach)
        existing_bookings = bookings_table.scan()
        for booking in existing_bookings['Items']:
            if (booking['bikeId'] == bike_id and 
                booking['bookingDate'] == booking_date and
                booking['status'] == 'confirmed'):
                # Check time overlap
                if (start_time < booking['endTime'] and end_time > booking['startTime']):
                    return respond(409, {"error": "Vehicle is not available for this time slot"})

        # Calculate total cost
        hourly_rate = float(bike['hourlyRate'])
        start_hour = int(start_time.split(':')[0])
        end_hour = int(end_time.split(':')[0])
        duration = end_hour - start_hour
        total_cost = hourly_rate * duration

        # Generate booking reference
        booking_reference = f"BK{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

        # Create booking item
        booking_id = str(uuid.uuid4())
        booking_item = {
            'bookingId': booking_id,
            'userId': user_id,
            'bikeId': bike_id,
            'bookingReference': booking_reference,
            'bookingDate': booking_date,
            'startTime': start_time,
            'endTime': end_time,
            'pickupLocation': pickup_location,
            'totalCost': Decimal(str(total_cost)),
            'hourlyRate': bike['hourlyRate'],
            'vehicleType': bike['type'],
            'vehicleModel': bike['model'],
            'accessCode': bike['accessCode'],
            'status': 'confirmed',
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }

        # Store booking in DynamoDB
        bookings_table.put_item(Item=booking_item)
        
        logger.info(f"Booking created successfully: {booking_reference}")
        
        return respond(201, {
            'message': 'Booking created successfully',
            'bookingReference': booking_reference,
            'bookingId': booking_id,
            'totalCost': total_cost,
            'accessCode': bike['accessCode'],
            'pickupLocation': pickup_location
        })
        
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        return respond(500, {"error": "Failed to create booking"})

def cancel_booking(booking_id, event):
    """Cancel a booking"""
    try:
        user_id = get_user_id(event)
        if not user_id:
            return respond(401, {"error": "Invalid or missing user authentication"})

        if not booking_id:
            return respond(400, {"error": "Missing booking ID"})

        # Get the booking
        response = bookings_table.get_item(Key={'bookingId': booking_id})
        if 'Item' not in response:
            return respond(404, {"error": "Booking not found"})

        booking = response['Item']

        # Check ownership
        if booking['userId'] != user_id:
            return respond(403, {"error": "Not authorized to cancel this booking"})

        # Check if booking can be cancelled
        if booking['status'] in ['cancelled', 'completed']:
            return respond(400, {"error": "Booking cannot be cancelled"})

        # Update booking status
        bookings_table.update_item(
            Key={'bookingId': booking_id},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'cancelled',
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )

        logger.info(f"Booking cancelled: {booking_id}")
        return respond(200, {"message": "Booking cancelled successfully"})
        
    except Exception as e:
        logger.error(f"Error cancelling booking: {str(e)}")
        return respond(500, {"error": "Failed to cancel booking"})

def get_available_vehicles(event):
    """Get available vehicles for a time slot"""
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        date = query_params.get('date')
        start_time = query_params.get('startTime')
        end_time = query_params.get('endTime')
        vehicle_type = query_params.get('type')

        logger.info(f"Query parameters: date={date}, startTime={start_time}, endTime={end_time}, type={vehicle_type}")

        if not all([date, start_time, end_time]):
            return respond(400, {"error": "Missing required parameters: date, startTime, endTime"})

        # Get all bikes
        try:
            bikes_response = bikes_table.scan()
            all_bikes = bikes_response['Items']
            logger.info(f"Found {len(all_bikes)} total bikes")
        except Exception as e:
            logger.error(f"Error scanning bikes table: {str(e)}")
            return respond(500, {"error": "Failed to retrieve vehicles"})

        # Filter by type if specified
        if vehicle_type:
            all_bikes = [bike for bike in all_bikes if bike.get('type') == vehicle_type]
            logger.info(f"After type filter: {len(all_bikes)} bikes")

        # Get existing bookings for the date
        try:
            bookings_response = bookings_table.scan()
            existing_bookings = [booking for booking in bookings_response['Items'] 
                               if booking['bookingDate'] == date and booking['status'] == 'confirmed']
            logger.info(f"Found {len(existing_bookings)} existing bookings for date {date}")
        except Exception as e:
            logger.error(f"Error scanning bookings table: {str(e)}")
            return respond(500, {"error": "Failed to check availability"})

        # Find available bikes
        available_bikes = []
        for bike in all_bikes:
            is_available = True
            
            # Check for conflicts
            for booking in existing_bookings:
                if (booking['bikeId'] == bike['bikeId'] and
                    start_time < booking['endTime'] and 
                    end_time > booking['startTime']):
                    is_available = False
                    logger.info(f"Bike {bike['bikeId']} not available due to conflict with booking {booking['bookingId']}")
                    break
            
            if is_available:
                available_bikes.append({
                    'bikeId': bike['bikeId'],
                    'type': bike['type'],
                    'model': bike['model'],
                    'hourlyRate': bike['hourlyRate'],
                    'batteryLife': bike.get('batteryLife', 'N/A'),
                    'features': bike.get('features', [])
                })

        logger.info(f"Found {len(available_bikes)} available vehicles")
        return respond(200, {
            'availableVehicles': available_bikes,
            'count': len(available_bikes)
        })
        
    except Exception as e:
        logger.error(f"Error getting available vehicles: {str(e)}", exc_info=True)
        return respond(500, {"error": "Failed to get available vehicles"})

def respond(status, body):
    """Standard response format"""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    } 