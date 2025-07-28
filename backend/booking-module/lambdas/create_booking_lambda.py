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
sns = boto3.client("sns")
sns_topic_arn = os.environ["SNS_TOPIC_ARN"]

def lambda_handler(event, context):
    """
    Create a new booking for an e-scooter
    """
    try:
        # Debug logging
        logger.info(f"Event structure: {json.dumps(event, default=str)}")
        
        # Parse the request
        if event.get('body'):
            body = json.loads(event['body'])
        else:
            body = event
        
        # Extract user info from Cognito claims
        try:
            # Debug the authorizer structure
            logger.info(f"Authorizer structure: {json.dumps(event.get('requestContext', {}).get('authorizer', {}), default=str)}")
            
            authorizer = event.get('requestContext', {}).get('authorizer', {})
            
            # For API Gateway v2 with JWT authorizer, claims are directly in the authorizer
            # The structure is: authorizer.jwt.claims
            if 'jwt' in authorizer and 'claims' in authorizer['jwt']:
                claims = authorizer['jwt']['claims']
                user_id = claims.get('sub', 'unknown')
                user_email = claims.get('email', 'unknown@example.com')
                logger.info(f"Extracted from jwt.claims - user_id: {user_id}, user_email: {user_email}")
            elif 'claims' in authorizer:
                # Fallback for different authorizer structure
                claims = authorizer['claims']
                user_id = claims.get('sub', 'unknown')
                user_email = claims.get('email', 'unknown@example.com')
                logger.info(f"Extracted from claims - user_id: {user_id}, user_email: {user_email}")
            else:
                # Last resort: try to extract from authorizer directly
                user_id = authorizer.get('sub', 'unknown')
                user_email = authorizer.get('email', 'unknown@example.com')
                logger.info(f"Extracted from authorizer directly - user_id: {user_id}, user_email: {user_email}")
                
            # Validate that we got a real user ID
            if user_id == 'unknown':
                logger.error("Failed to extract user ID from JWT claims")
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Invalid authentication token - user ID not found'
                    })
                }
                
        except (KeyError, TypeError) as e:
            logger.error(f"Error extracting user claims: {str(e)}")
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Invalid authentication token'
                })
            }
        
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
            
            # Use timezone-aware datetime.now() for comparison
            current_time = datetime.now().replace(tzinfo=start_datetime.tzinfo)
            if start_datetime < current_time:
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
        
        # Check if bike exists
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
            
            # Check if bike is available
            if bike_data.get('status', {}).get('S', 'available') != 'available':
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': f'Bike is currently {bike_data.get("status", {}).get("S", "unavailable")}'
                    })
                }
                
        except Exception as e:
            logger.error(f"Error checking bike: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error checking bike'
                })
            }
        
        # Check for booking conflicts (overlapping time periods)
        try:
            # Query existing bookings for this bike that overlap with the requested time period
            # We need to check for any active bookings that overlap
            conflict_query_params = {
                'TableName': bookings_table,
                'IndexName': 'BikeBookingsIndex',
                'KeyConditionExpression': 'bikeId = :bikeId',
                'FilterExpression': '#status = :status AND startDate <= :endDate AND endDate >= :startDate',
                'ExpressionAttributeNames': {
                    '#status': 'status'
                },
                'ExpressionAttributeValues': {
                    ':bikeId': {'S': bike_id},
                    ':status': {'S': 'active'},
                    ':startDate': {'S': start_date},
                    ':endDate': {'S': end_date}
                }
            }
            
            conflict_response = dynamodb.query(**conflict_query_params)
            
            if conflict_response.get('Items'):
                conflicting_booking = conflict_response['Items'][0]
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Bike is already booked for this time period',
                        'conflictingBooking': {
                            'startDate': conflicting_booking['startDate']['S'],
                            'endDate': conflicting_booking['endDate']['S']
                        }
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
                    'error': 'Error checking booking availability'
                })
            }
        

        
        # Create booking
        booking_id = str(uuid.uuid4())
        current_time = datetime.now().replace(tzinfo=start_datetime.tzinfo).isoformat()
        
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

            # Update bike status to unavailable
            try:
                dynamodb.update_item(
                    TableName=bike_inventory_table,
                    Key={'bikeId': {'S': bike_id}},
                    UpdateExpression="SET #status = :status",
                    ExpressionAttributeNames={
                        '#status': 'status'
                    },
                    ExpressionAttributeValues={
                        ':status': {'S': 'unavailable'}
                    }
                )
                logger.info(f"Bike {bike_id} status updated to unavailable")
            except Exception as e:
                logger.error(f"Error updating bike status: {str(e)}")
                # Don't fail the booking creation if bike status update fails
                # The booking is already created successfully

            # Publish booking confirmation to SNS
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject="DALScooter Booking Confirmation",
                Message=(
                    f"Hello {user_email},\n\n"
                    f"Booking confirmed!\n\n"
                    f"Booking ID: {booking_id}\n"
                    f"Bike: {bike_data.get('model', {'S': 'Unknown'})['S']} ({bike_data.get('type', {'S': 'Unknown'})['S']})\n"
                    f"From: {start_date}\nTo: {end_date}\n\n"
                    f"Thank you for choosing DALScooter!"
                )
            )
            
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

            sns.publish(
                TopicArn=sns_topic_arn,
                Subject="DALScooter Booking Failed",
                Message=(
                    f"Hello {user_email},\n\n"
                    f"Unfortunately, your booking attempt failed.\n\n"
                    f"Booking details:\nBike ID: {bike_id}\n"
                    f"Start: {start_date}, End: {end_date}\n\n"
                    f"Please try again or contact support if the issue persists."
                )
            )

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