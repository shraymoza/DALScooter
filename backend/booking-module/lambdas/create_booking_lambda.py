import json
import boto3
import os
import uuid
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def generate_booking_reference():
    """Generate a unique booking reference in format BK-XXXXXX"""
    import random
    import string
    letters = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"BK-{letters}"

def check_booking_conflicts(bike_id, booking_date, start_time, end_time):
    """Check if the requested time slot conflicts with existing bookings"""
    try:
        # Query existing bookings for this bike on the same date
        response = bookings_table.query(
            IndexName='BikeIdIndex',
            KeyConditionExpression=Key('bikeId').eq(bike_id),
            FilterExpression='#date = :date',
            ExpressionAttributeNames={'#date': 'bookingDate'},
            ExpressionAttributeValues={':date': booking_date}
        )
        
        existing_bookings = response.get('Items', [])
        
        # Check for time conflicts
        for booking in existing_bookings:
            existing_start = booking.get('startTime')
            existing_end = booking.get('endTime')
            
            # Convert times to comparable format
            requested_start = datetime.strptime(start_time, '%H:%M').time()
            requested_end = datetime.strptime(end_time, '%H:%M').time()
            existing_start_time = datetime.strptime(existing_start, '%H:%M').time()
            existing_end_time = datetime.strptime(existing_end, '%H:%M').time()
            
            # Check for overlap
            if (requested_start < existing_end_time and requested_end > existing_start_time):
                return True, f"Time slot conflicts with existing booking {booking.get('bookingReference')}"
        
        return False, None
        
    except Exception as e:
        logger.error(f"Error checking booking conflicts: {str(e)}")
        raise e

def calculate_total_cost(hourly_rate, start_time, end_time):
    """Calculate total cost based on duration and hourly rate"""
    start_dt = datetime.strptime(start_time, '%H:%M')
    end_dt = datetime.strptime(end_time, '%H:%M')
    
    # Handle overnight bookings
    if end_dt < start_dt:
        end_dt += timedelta(days=1)
    
    duration_hours = (end_dt - start_dt).total_seconds() / 3600
    return round(float(hourly_rate) * duration_hours, 2)

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract user info from JWT
        # Handle different JWT claim structures
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        jwt_claims = authorizer.get('jwt', {}).get('claims', {})
        
        if not jwt_claims:
            # Try alternative structure
            jwt_claims = authorizer.get('claims', {})
        
        user_id = jwt_claims.get('sub')
        user_email = jwt_claims.get('email')
        
        if not user_id or not user_email:
            logger.error(f"Missing user info in JWT claims: {jwt_claims}")
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid or missing user authentication'})
            }
        
        # Parse request body
        body = json.loads(event['body'])
        bike_id = body.get('bikeId')
        booking_date = body.get('bookingDate')
        start_time = body.get('startTime')
        end_time = body.get('endTime')
        pickup_location = body.get('pickupLocation')
        
        # Validate required fields
        if not all([bike_id, booking_date, start_time, end_time, pickup_location]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        # Validate time format
        try:
            datetime.strptime(start_time, '%H:%M')
            datetime.strptime(end_time, '%H:%M')
        except ValueError:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid time format. Use HH:MM'})
            }
        
        # Validate date format
        try:
            datetime.strptime(booking_date, '%Y-%m-%d')
        except ValueError:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid date format. Use YYYY-MM-DD'})
            }
        
        # Check if bike exists and get its details
        bike_response = bikes_table.get_item(Key={'bikeId': bike_id})
        if 'Item' not in bike_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Vehicle not found'})
            }
        
        bike = bike_response['Item']
        
        # Check for booking conflicts
        has_conflict, conflict_message = check_booking_conflicts(bike_id, booking_date, start_time, end_time)
        if has_conflict:
            return {
                'statusCode': 409,
                'body': json.dumps({'error': conflict_message})
            }
        
        # Calculate total cost
        total_cost = calculate_total_cost(bike['hourlyRate'], start_time, end_time)
        
        # Generate booking reference
        booking_reference = generate_booking_reference()
        
        # Create booking item
        booking_id = str(uuid.uuid4())
        booking_item = {
            'bookingId': booking_id,
            'userId': user_id,
            'userEmail': user_email,
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
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'message': 'Booking created successfully',
                'bookingReference': booking_reference,
                'bookingId': booking_id,
                'totalCost': total_cost,
                'accessCode': bike['accessCode'],
                'pickupLocation': pickup_location
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({'error': 'Internal server error'})
        } 