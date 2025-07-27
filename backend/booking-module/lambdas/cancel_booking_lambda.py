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
    Cancel a booking
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
                    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Booking ID is required'
                })
            }
        
        # Get the existing booking
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
                        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Booking not found'
                    })
                }
            
            existing_booking = booking_response['Item']
            
            # Check if user owns this booking (unless admin)
            if not is_admin and existing_booking['userId']['S'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'You can only cancel your own bookings'
                    })
                }
            
            # Check if booking can be cancelled
            booking_status = existing_booking['status']['S']
            if booking_status == 'cancelled':
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Booking is already cancelled'
                    })
                }
            
            if booking_status == 'completed':
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Cannot cancel a completed booking'
                    })
                }
            
            # Check if booking has already started
            start_date = existing_booking['startDate']['S']
            try:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start_datetime < datetime.now():
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                        },
                        'body': json.dumps({
                            'error': 'Cannot cancel a booking that has already started'
                        })
                    }
            except ValueError:
                logger.warning(f"Invalid start date format for booking {booking_id}")
                
        except Exception as e:
            logger.error(f"Error retrieving booking: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error retrieving booking'
                })
            }
        
        # Cancel the booking
        current_time = datetime.utcnow().isoformat() + 'Z'
        
        try:
            dynamodb.update_item(
                TableName=bookings_table,
                Key={'bookingId': {'S': booking_id}},
                UpdateExpression="SET #status = :status, #updatedAt = :updatedAt",
                ExpressionAttributeNames={
                    '#status': 'status',
                    '#updatedAt': 'updatedAt'
                },
                ExpressionAttributeValues={
                    ':status': {'S': 'cancelled'},
                    ':updatedAt': {'S': current_time}
                }
            )
            
            logger.info(f"Booking {booking_id} cancelled successfully")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                },
                'body': json.dumps({
                    'message': 'Booking cancelled successfully',
                    'bookingId': booking_id,
                    'cancelledAt': current_time,
                    'booking': {
                        'bookingId': booking_id,
                        'userId': existing_booking['userId']['S'],
                        'userEmail': existing_booking.get('userEmail', {}).get('S', ''),
                        'bikeId': existing_booking['bikeId']['S'],
                        'startDate': existing_booking['startDate']['S'],
                        'endDate': existing_booking['endDate']['S'],
                        'duration': int(existing_booking['duration']['N']),
                        'status': 'cancelled',
                        'notes': existing_booking.get('notes', {}).get('S', ''),
                        'createdAt': existing_booking['createdAt']['S'],
                        'updatedAt': current_time,
                        'bikeModel': existing_booking.get('bikeModel', {}).get('S', 'Unknown'),
                        'bikeType': existing_booking.get('bikeType', {}).get('S', 'Unknown')
                    }
                })
            }
            
        except Exception as e:
            logger.error(f"Error cancelling booking: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error cancelling booking'
                })
            }
            
    except Exception as e:
        logger.error(f"Unexpected error in cancel_booking_lambda: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        } 