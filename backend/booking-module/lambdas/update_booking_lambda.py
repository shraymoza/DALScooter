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
    Update an existing booking
    """
    try:
        # Parse the request
        if event.get('body'):
            body = json.loads(event['body'])
        else:
            body = event
        
        # Extract user info from Cognito claims
        try:
            authorizer = event.get('requestContext', {}).get('authorizer', {})
            
            # Try different possible claim structures
            if 'claims' in authorizer:
                claims = authorizer['claims']
                user_id = claims.get('sub', 'unknown')
                user_email = claims.get('email', 'unknown@example.com')
                user_groups = claims.get('cognito:groups', '')
            elif 'jwt' in authorizer:
                jwt_data = authorizer['jwt']
                user_id = jwt_data.get('sub', 'unknown')
                user_email = jwt_data.get('email', 'unknown@example.com')
                user_groups = jwt_data.get('cognito:groups', '')
            else:
                user_id = authorizer.get('sub', 'unknown')
                user_email = authorizer.get('email', 'unknown@example.com')
                user_groups = authorizer.get('cognito:groups', '')
                
        except (KeyError, TypeError) as e:
            logger.error(f"Error extracting user claims: {str(e)}")
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Invalid authentication token'
                })
            }
        
        # Check if user is admin (BikeFranchise group)
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
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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
                        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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
                        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'You can only update your own bookings'
                    })
                }
            
            # Check if booking can be updated (not cancelled or completed)
            booking_status = existing_booking['status']['S']
            if booking_status in ['cancelled', 'completed']:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': f'Cannot update booking with status: {booking_status}'
                    })
                }
                
        except Exception as e:
            logger.error(f"Error retrieving booking: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error retrieving booking'
                })
            }
        
        # Prepare update expression and attribute values
        update_expression = "SET "
        expression_attribute_names = {}
        expression_attribute_values = {}
        
        # Fields that can be updated
        updatable_fields = ['startDate', 'endDate', 'duration', 'notes', 'status']
        updated_fields = []
        
        for field in updatable_fields:
            if field in body:
                field_value = body[field]
                
                # Validate dates if updating
                if field in ['startDate', 'endDate']:
                    try:
                        field_datetime = datetime.fromisoformat(field_value.replace('Z', '+00:00'))
                        if field == 'startDate' and field_datetime < datetime.now().replace(tzinfo=field_datetime.tzinfo):
                            return {
                                'statusCode': 400,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                                },
                                'body': json.dumps({
                                    'error': 'Start date cannot be in the past'
                                })
                            }
                    except ValueError:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                                'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                            },
                            'body': json.dumps({
                                'error': f'Invalid date format for {field}'
                            })
                        }
                
                # Validate status if updating
                if field == 'status' and field_value not in ['active', 'cancelled', 'completed']:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                        },
                        'body': json.dumps({
                            'error': 'Invalid status. Must be active, cancelled, or completed'
                        })
                    }
                
                # Add to update expression
                attr_name = f"#{field}"
                attr_value = f":{field}"
                
                update_expression += f"{attr_name} = {attr_value}, "
                expression_attribute_names[attr_name] = field
                
                if field == 'duration':
                    expression_attribute_values[attr_value] = {'N': str(field_value)}
                else:
                    expression_attribute_values[attr_value] = {'S': str(field_value)}
                
                updated_fields.append(field)
        
        # Add updatedAt timestamp
        current_time = datetime.utcnow().isoformat() + 'Z'
        update_expression += "#updatedAt = :updatedAt"
        expression_attribute_names["#updatedAt"] = "updatedAt"
        expression_attribute_values[":updatedAt"] = {'S': current_time}
        
        # Update bookingDate if startDate is being updated
        if 'startDate' in body:
            update_expression += ", #bookingDate = :bookingDate"
            expression_attribute_names["#bookingDate"] = "bookingDate"
            expression_attribute_values[":bookingDate"] = {'S': body['startDate'].split('T')[0]}
        
        try:
            # Perform the update
            dynamodb.update_item(
                TableName=bookings_table,
                Key={'bookingId': {'S': booking_id}},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values
            )
            
            logger.info(f"Booking {booking_id} updated successfully")
            
            # Return the updated booking
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                },
                'body': json.dumps({
                    'message': 'Booking updated successfully',
                    'bookingId': booking_id,
                    'updatedFields': updated_fields,
                    'updatedAt': current_time
                })
            }
            
        except Exception as e:
            logger.error(f"Error updating booking: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Error updating booking'
                })
            }
            
    except Exception as e:
        logger.error(f"Unexpected error in update_booking_lambda: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'PUT,OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        } 