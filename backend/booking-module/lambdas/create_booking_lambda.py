import json
import boto3
import os
import uuid
from datetime import datetime, timedelta
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.client('dynamodb')
bookings_table = os.environ['BOOKINGS_TABLE']
bike_inventory_table = os.environ['BIKE_INVENTORY_TABLE']

def lambda_handler(event, context):
    """
    Create a new booking for an e-scooter
    """
    try:
        # Parse the request
        if event.get('body'):
            body = json.loads(event['body'])
        else:
            body = event
        
        # Extract user info from Cognito claims
        user_id = event['requestContext']['authorizer']['claims']['sub']
        user_email = event['requestContext']['authorizer']['claims']['email']
        
        # Validate required fields
        required_fields = ['bikeId', 'startDate', 'endDate', 'duration']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': f'Missing required field: {field}'
                    })
                }
        
        bike_id = body['bikeId']
        start_date = body['startDate']
        end_date = body['endDate']
        duration = body['duration']
        notes = body.get('notes', '')
        
        # Validate dates
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            if start_datetime >= end_datetime:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Start date must be before end date'
                    })
                }
            
            if start_datetime < datetime.now():
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Start date cannot be in the past'
                    })
                }
                
        except ValueError as e:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': f'Invalid date format: {str(e)}'
                })
            }
        
        # Check if bike exists and is available
        try:
            bike_response = dynamodb.get_item(
                TableName=bike_inventory_table,
                Key={'bikeId': {'S': bike_id}}
            )
            
            if 'Item' not in bike_response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Bike not found'
                    })
                }
            
            bike_data = bike_response['Item']
            if bike_data.get('status', {}).get('S') != 'available':
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Bike is not available for booking'
                    })
                }
                
        except Exception as e:
            logger.error(f"Error checking bike availability: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error checking bike availability'
                })
            }
        
        # Check for booking conflicts
        try:
            conflict_response = dynamodb.query(
                TableName=bookings_table,
                IndexName='BikeBookingsIndex',
                KeyConditionExpression='bikeId = :bikeId',
                FilterExpression='#status = :status',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':bikeId': {'S': bike_id},
                    ':status': {'S': 'active'}
                }
            )
            
            # Check for overlapping bookings
            for booking in conflict_response.get('Items', []):
                booking_start = datetime.fromisoformat(booking['startDate']['S'].replace('Z', '+00:00'))
                booking_end = datetime.fromisoformat(booking['endDate']['S'].replace('Z', '+00:00'))
                
                if (start_datetime < booking_end and end_datetime > booking_start):
                    return {
                        'statusCode': 409,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'POST,OPTIONS'
                        },
                        'body': json.dumps({
                            'error': 'Bike is already booked for this time period'
                        })
                    }
                    
        except Exception as e:
            logger.error(f"Error checking booking conflicts: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error checking booking conflicts'
                })
            }
        
        # Create booking
        booking_id = str(uuid.uuid4())
        current_time = datetime.utcnow().isoformat() + 'Z'
        
        booking_item = {
            'bookingId': {'S': booking_id},
            'userId': {'S': user_id},
            'userEmail': {'S': user_email},
            'bikeId': {'S': bike_id},
            'startDate': {'S': start_date},
            'endDate': {'S': end_date},
            'duration': {'N': str(duration)},
            'status': {'S': 'active'},
            'notes': {'S': notes},
            'createdAt': {'S': current_time},
            'updatedAt': {'S': current_time},
            'bookingDate': {'S': start_date.split('T')[0]}  # For GSI
        }
        
        # Add bike details to booking
        booking_item['bikeModel'] = bike_data.get('model', {'S': 'Unknown'})
        booking_item['bikeType'] = bike_data.get('type', {'S': 'Unknown'})
        
        try:
            dynamodb.put_item(
                TableName=bookings_table,
                Item=booking_item
            )
            
            logger.info(f"Booking created successfully: {booking_id}")
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'message': 'Booking created successfully',
                    'bookingId': booking_id,
                    'booking': {
                        'bookingId': booking_id,
                        'userId': user_id,
                        'userEmail': user_email,
                        'bikeId': bike_id,
                        'startDate': start_date,
                        'endDate': end_date,
                        'duration': duration,
                        'status': 'active',
                        'notes': notes,
                        'createdAt': current_time,
                        'bikeModel': booking_item['bikeModel']['S'],
                        'bikeType': booking_item['bikeType']['S']
                    }
                })
            }
            
        except Exception as e:
            logger.error(f"Error creating booking: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error creating booking'
                })
            }
            
    except Exception as e:
        logger.error(f"Unexpected error in create_booking_lambda: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        } 