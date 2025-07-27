import json
import boto3
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.client('dynamodb')
bookings_table = os.environ['BOOKINGS_TABLE']

def lambda_handler(event, context):
    """
    Get detailed information about a specific booking
    """
    try:
        # Extract user info from Cognito claims
        user_id = event['requestContext']['authorizer']['claims']['sub']
        user_email = event['requestContext']['authorizer']['claims']['email']
        
        # Check if user is admin (BikeFranchise group)
        user_groups = event['requestContext']['authorizer']['claims'].get('cognito:groups', '')
        is_admin = 'BikeFranchise' in user_groups
        
        # Get booking ID from path parameters
        path_params = event.get('pathParameters', {}) or {}
        booking_id = path_params.get('bookingId')
        
        if not booking_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Booking ID is required'
                })
            }
        
        # Get the booking details
        try:
            booking_response = dynamodb.get_item(
                TableName=bookings_table,
                Key={'bookingId': {'S': booking_id}}
            )
            
            if 'Item' not in booking_response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Booking not found'
                    })
                }
            
            booking_item = booking_response['Item']
            
            # Check if user owns this booking (unless admin)
            if not is_admin and booking_item['userId']['S'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'You can only view your own bookings'
                    })
                }
            
            # Format the booking details
            booking = {
                'bookingId': booking_item['bookingId']['S'],
                'userId': booking_item['userId']['S'],
                'userEmail': booking_item.get('userEmail', {}).get('S', ''),
                'bikeId': booking_item['bikeId']['S'],
                'startDate': booking_item['startDate']['S'],
                'endDate': booking_item['endDate']['S'],
                'duration': int(booking_item['duration']['N']),
                'status': booking_item['status']['S'],
                'notes': booking_item.get('notes', {}).get('S', ''),
                'createdAt': booking_item['createdAt']['S'],
                'updatedAt': booking_item.get('updatedAt', {}).get('S', ''),
                'bikeModel': booking_item.get('bikeModel', {}).get('S', 'Unknown'),
                'bikeType': booking_item.get('bikeType', {}).get('S', 'Unknown')
            }
            
            # Add additional calculated fields
            try:
                start_datetime = datetime.fromisoformat(booking['startDate'].replace('Z', '+00:00'))
                end_datetime = datetime.fromisoformat(booking['endDate'].replace('Z', '+00:00'))
                current_time = datetime.now()
                
                # Calculate time until booking starts
                if start_datetime > current_time:
                    time_until_start = start_datetime - current_time
                    booking['timeUntilStart'] = {
                        'days': time_until_start.days,
                        'hours': time_until_start.seconds // 3600,
                        'minutes': (time_until_start.seconds % 3600) // 60
                    }
                else:
                    booking['timeUntilStart'] = None
                
                # Calculate if booking is active, upcoming, or past
                if current_time < start_datetime:
                    booking['bookingState'] = 'upcoming'
                elif start_datetime <= current_time <= end_datetime:
                    booking['bookingState'] = 'active'
                else:
                    booking['bookingState'] = 'past'
                
                # Calculate remaining time for active bookings
                if booking['bookingState'] == 'active':
                    remaining_time = end_datetime - current_time
                    booking['remainingTime'] = {
                        'hours': remaining_time.seconds // 3600,
                        'minutes': (remaining_time.seconds % 3600) // 60
                    }
                else:
                    booking['remainingTime'] = None
                    
            except ValueError as e:
                logger.warning(f"Error calculating time fields for booking {booking_id}: {str(e)}")
                booking['timeUntilStart'] = None
                booking['bookingState'] = 'unknown'
                booking['remainingTime'] = None
            
            logger.info(f"Retrieved booking details for {booking_id}")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                'body': json.dumps({
                    'booking': booking,
                    'userEmail': user_email,
                    'isAdmin': is_admin
                })
            }
            
        except Exception as e:
            logger.error(f"Error retrieving booking details: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error retrieving booking details'
                })
            }
            
    except Exception as e:
        logger.error(f"Unexpected error in get_booking_details_lambda: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        } 