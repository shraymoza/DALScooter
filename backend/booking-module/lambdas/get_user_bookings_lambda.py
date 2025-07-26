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
    logger.info("VERSION: Updated Lambda with scan-first approach")
    
    try:
        # Extract user info from JWT
        # Handle different JWT claim structures
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        logger.info(f"Authorizer: {json.dumps(authorizer)}")
        
        jwt_claims = authorizer.get('jwt', {}).get('claims', {})
        
        if not jwt_claims:
            # Try alternative structure
            jwt_claims = authorizer.get('claims', {})
        
        logger.info(f"JWT Claims: {json.dumps(jwt_claims)}")
        
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
        
        # Query user's bookings - try multiple approaches
        bookings = []
        
        # First try: Simple scan and filter in Python (most reliable)
        try:
            logger.info("Attempting full scan with Python filtering...")
            response = bookings_table.scan()
            all_bookings = response.get('Items', [])
            # Filter by userId in Python
            bookings = [b for b in all_bookings if b.get('userId') == user_id]
            logger.info(f"Scan found {len(bookings)} bookings for user {user_id}")
        except Exception as scan_error:
            logger.error(f"Full scan failed: {str(scan_error)}")
            
            # Second try: Scan with DynamoDB filter
            try:
                logger.info("Attempting scan with DynamoDB filter...")
                response = bookings_table.scan(
                    FilterExpression=Key('userId').eq(user_id)
                )
                bookings = response.get('Items', [])
                logger.info(f"Filtered scan found {len(bookings)} bookings")
            except Exception as filter_error:
                logger.error(f"Filtered scan failed: {str(filter_error)}")
                
                # Third try: GSI query (if available)
                try:
                    logger.info("Attempting GSI query...")
                    response = bookings_table.query(
                        IndexName='UserIdIndex',
                        KeyConditionExpression=Key('userId').eq(user_id),
                        ScanIndexForward=False
                    )
                    bookings = response.get('Items', [])
                    logger.info(f"GSI query found {len(bookings)} bookings")
                except Exception as gsi_error:
                    logger.error(f"GSI query failed: {str(gsi_error)}")
                    bookings = []
        
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