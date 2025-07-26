import json
import boto3
import os
import logging
from datetime import datetime
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])

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
        
        if not user_id:
            logger.error(f"Missing user ID in JWT claims: {jwt_claims}")
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid or missing user authentication'})
            }
        
        # Get booking ID from path parameters
        path_params = event.get('pathParameters', {}) or {}
        booking_id = path_params.get('bookingId')
        
        if not booking_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Booking ID is required'})
            }
        
        # Get the booking to verify ownership and current status
        response = bookings_table.get_item(
            Key={
                'bookingId': booking_id,
                'userId': user_id
            }
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Booking not found or access denied'})
            }
        
        booking = response['Item']
        
        # Check if booking can be cancelled
        if booking['status'] == 'cancelled':
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Booking is already cancelled'})
            }
        
        if booking['status'] == 'completed':
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Cannot cancel completed booking'})
            }
        
        # Check if booking is in the past
        booking_date = datetime.strptime(booking['bookingDate'], '%Y-%m-%d').date()
        today = datetime.now().date()
        
        if booking_date < today:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Cannot cancel past bookings'})
            }
        
        # Update booking status to cancelled
        bookings_table.update_item(
            Key={
                'bookingId': booking_id,
                'userId': user_id
            },
            UpdateExpression='SET #status = :status, #updatedAt = :updatedAt',
            ExpressionAttributeNames={
                '#status': 'status',
                '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues={
                ':status': 'cancelled',
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Booking {booking_id} cancelled successfully")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'message': 'Booking cancelled successfully',
                'bookingReference': booking['bookingReference']
            })
        }
        
    except Exception as e:
        logger.error(f"Error cancelling booking: {str(e)}", exc_info=True)
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