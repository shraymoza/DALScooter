import json
import boto3
import os
import logging
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table(os.environ['BOOKINGS_TABLE'])

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

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
        
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        status_filter = query_params.get('status')
        date_filter = query_params.get('date')
        
        # Query user's bookings using UserIdIndex
        response = bookings_table.query(
            IndexName='UserIdIndex',
            KeyConditionExpression=Key('userId').eq(user_id),
            ScanIndexForward=False  # Sort by bookingId descending (newest first)
        )
        
        bookings = response.get('Items', [])
        
        # Apply filters if provided
        if status_filter:
            bookings = [b for b in bookings if b.get('status') == status_filter]
        
        if date_filter:
            bookings = [b for b in bookings if b.get('bookingDate') == date_filter]
        
        # Format bookings for response
        formatted_bookings = []
        for booking in bookings:
            formatted_booking = {
                'bookingId': booking['bookingId'],
                'bookingReference': booking['bookingReference'],
                'bikeId': booking['bikeId'],
                'bookingDate': booking['bookingDate'],
                'startTime': booking['startTime'],
                'endTime': booking['endTime'],
                'pickupLocation': booking['pickupLocation'],
                'totalCost': booking['totalCost'],
                'hourlyRate': booking['hourlyRate'],
                'vehicleType': booking['vehicleType'],
                'vehicleModel': booking['vehicleModel'],
                'accessCode': booking['accessCode'],
                'status': booking['status'],
                'createdAt': booking['createdAt'],
                'updatedAt': booking['updatedAt']
            }
            formatted_bookings.append(formatted_booking)
        
        logger.info(f"Retrieved {len(formatted_bookings)} bookings for user {user_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'bookings': formatted_bookings,
                'count': len(formatted_bookings)
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving user bookings: {str(e)}", exc_info=True)
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