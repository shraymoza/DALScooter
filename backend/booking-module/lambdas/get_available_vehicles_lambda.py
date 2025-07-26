import json
import boto3
import os
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

def get_booked_vehicles(booking_date, start_time, end_time):
    """Get list of vehicle IDs that are booked for the specified time slot"""
    try:
        # Query all bookings for the specified date
        response = bookings_table.query(
            IndexName='BookingDateIndex',
            KeyConditionExpression=Key('bookingDate').eq(booking_date),
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'confirmed'}
        )
        
        booked_vehicles = set()
        
        for booking in response.get('Items', []):
            booking_start = booking.get('startTime')
            booking_end = booking.get('endTime')
            
            # Check for time overlap
            if has_time_overlap(start_time, end_time, booking_start, booking_end):
                booked_vehicles.add(booking.get('bikeId'))
        
        return booked_vehicles
        
    except Exception as e:
        logger.error(f"Error getting booked vehicles: {str(e)}")
        return set()

def has_time_overlap(start1, end1, start2, end2):
    """Check if two time ranges overlap"""
    start1_dt = datetime.strptime(start1, '%H:%M').time()
    end1_dt = datetime.strptime(end1, '%H:%M').time()
    start2_dt = datetime.strptime(start2, '%H:%M').time()
    end2_dt = datetime.strptime(end2, '%H:%M').time()
    
    # Handle overnight bookings
    if end1_dt < start1_dt:
        end1_dt = datetime.combine(datetime.now().date() + timedelta(days=1), end1_dt).time()
    if end2_dt < start2_dt:
        end2_dt = datetime.combine(datetime.now().date() + timedelta(days=1), end2_dt).time()
    
    return start1_dt < end2_dt and start2_dt < end1_dt

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        booking_date = query_params.get('date')
        start_time = query_params.get('startTime')
        end_time = query_params.get('endTime')
        vehicle_type = query_params.get('type')
        
        # Validate required parameters
        if not booking_date:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Date parameter is required'})
            }
        
        # Validate date format
        try:
            datetime.strptime(booking_date, '%Y-%m-%d')
        except ValueError:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid date format. Use YYYY-MM-DD'})
            }
        
        # Get all vehicles
        response = bikes_table.scan()
        all_vehicles = response.get('Items', [])
        
        # Filter by vehicle type if specified
        if vehicle_type:
            all_vehicles = [v for v in all_vehicles if v.get('type') == vehicle_type]
        
        # If time range is provided, check for conflicts
        if start_time and end_time:
            # Validate time format
            try:
                datetime.strptime(start_time, '%H:%M')
                datetime.strptime(end_time, '%H:%M')
            except ValueError:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Invalid time format. Use HH:MM'})
                }
            
            # Get booked vehicles for the time slot
            booked_vehicle_ids = get_booked_vehicles(booking_date, start_time, end_time)
            
            # Filter out booked vehicles
            available_vehicles = [v for v in all_vehicles if v.get('bikeId') not in booked_vehicle_ids]
        else:
            # If no time range provided, return all vehicles
            available_vehicles = all_vehicles
        
        # Format response
        formatted_vehicles = []
        for vehicle in available_vehicles:
            formatted_vehicle = {
                'bikeId': vehicle['bikeId'],
                'type': vehicle['type'],
                'model': vehicle['model'],
                'accessCode': vehicle['accessCode'],
                'batteryLife': vehicle['batteryLife'],
                'hourlyRate': vehicle['hourlyRate'],
                'discount': vehicle.get('discount', ''),
                'features': vehicle.get('features', [])
            }
            formatted_vehicles.append(formatted_vehicle)
        
        logger.info(f"Found {len(formatted_vehicles)} available vehicles for {booking_date}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'vehicles': formatted_vehicles,
                'count': len(formatted_vehicles),
                'date': booking_date,
                'startTime': start_time,
                'endTime': end_time
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error getting available vehicles: {str(e)}", exc_info=True)
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