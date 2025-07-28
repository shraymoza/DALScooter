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
    Get bookings for a user with optional filtering
    Version: 3.0 - Fixed JWT claims extraction for API Gateway v2
    """
    try:
        # Extract user info from Cognito claims
        try:
            # Debug the authorizer structure
            logger.info(f"Full event structure: {json.dumps(event, default=str)}")
            
            authorizer = event.get('requestContext', {}).get('authorizer', {})
            logger.info(f"Authorizer structure: {json.dumps(authorizer, default=str)}")
            
            # For API Gateway v2 with JWT authorizer, claims are directly in the authorizer
            # The structure is: authorizer.jwt.claims
            if 'jwt' in authorizer and 'claims' in authorizer['jwt']:
                claims = authorizer['jwt']['claims']
                user_id = claims.get('sub', 'unknown')
                user_email = claims.get('email', 'unknown@example.com')
                user_groups = claims.get('cognito:groups', '')
                logger.info(f"Extracted from jwt.claims - user_id: {user_id}, user_email: {user_email}, groups: {user_groups}")
            elif 'claims' in authorizer:
                # Fallback for different authorizer structure
                claims = authorizer['claims']
                user_id = claims.get('sub', 'unknown')
                user_email = claims.get('email', 'unknown@example.com')
                user_groups = claims.get('cognito:groups', '')
                logger.info(f"Extracted from claims - user_id: {user_id}, user_email: {user_email}, groups: {user_groups}")
            else:
                # Last resort: try to extract from authorizer directly
                user_id = authorizer.get('sub', 'unknown')
                user_email = authorizer.get('email', 'unknown@example.com')
                user_groups = authorizer.get('cognito:groups', '')
                logger.info(f"Extracted from authorizer directly - user_id: {user_id}, user_email: {user_email}, groups: {user_groups}")
                
            # Validate that we got a real user ID
            if user_id == 'unknown':
                logger.error("Failed to extract user ID from JWT claims")
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,OPTIONS'
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
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Invalid authentication token'
                })
            }
        
        # Check if user is admin (BikeFranchise group)
        is_admin = 'BikeFranchise' in user_groups
        
        # Parse query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        status_filter = query_params.get('status')
        date_filter = query_params.get('date')
        limit = int(query_params.get('limit', 50))
        
        # Build query parameters
        query_params_dynamo = {
            'TableName': bookings_table,
            'IndexName': 'UserBookingsIndex',
            'KeyConditionExpression': 'userId = :userId',
            'ExpressionAttributeValues': {
                ':userId': {'S': user_id}
            },
            'ScanIndexForward': False,  # Most recent first
            'Limit': limit
        }
        
        # Add status filter if provided
        if status_filter:
            query_params_dynamo['FilterExpression'] = '#status = :status'
            query_params_dynamo['ExpressionAttributeNames'] = {
                '#status': 'status'
            }
            query_params_dynamo['ExpressionAttributeValues'][':status'] = {'S': status_filter}
        
        # Add date filter if provided
        if date_filter:
            if 'FilterExpression' in query_params_dynamo:
                query_params_dynamo['FilterExpression'] += ' AND begins_with(bookingDate, :date)'
            else:
                query_params_dynamo['FilterExpression'] = 'begins_with(bookingDate, :date)'
            
            if 'ExpressionAttributeNames' not in query_params_dynamo:
                query_params_dynamo['ExpressionAttributeNames'] = {}
            
            query_params_dynamo['ExpressionAttributeValues'][':date'] = {'S': date_filter}
        
        # If admin, get all bookings instead of user-specific
        if is_admin:
            # Remove user-specific query and use scan instead
            scan_params = {
                'TableName': bookings_table,
                'Limit': limit
            }
            
            if status_filter:
                scan_params['FilterExpression'] = '#status = :status'
                scan_params['ExpressionAttributeNames'] = {
                    '#status': 'status'
                }
                scan_params['ExpressionAttributeValues'] = {
                    ':status': {'S': status_filter}
                }
            
            try:
                response = dynamodb.scan(**scan_params)
            except Exception as e:
                logger.error(f"Error scanning bookings for admin: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Error retrieving bookings'
                    })
                }
        else:
            # Regular user query
            try:
                response = dynamodb.query(**query_params_dynamo)
            except Exception as e:
                logger.error(f"Error querying bookings: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,OPTIONS'
                    },
                    'body': json.dumps({
                        'error': 'Error retrieving bookings'
                    })
                }
        
        # Process and format bookings
        bookings = []
        for item in response.get('Items', []):
            booking = {
                'bookingId': item['bookingId']['S'],
                'userId': item['userId']['S'],
                'userEmail': item.get('userEmail', {}).get('S', ''),
                'bikeId': item['bikeId']['S'],
                'startDate': item['startDate']['S'],
                'endDate': item['endDate']['S'],
                'duration': int(item['duration']['N']),
                'status': item['status']['S'],
                'notes': item.get('notes', {}).get('S', ''),
                'createdAt': item['createdAt']['S'],
                'updatedAt': item.get('updatedAt', {}).get('S', ''),
                'bikeModel': item.get('bikeModel', {}).get('S', 'Unknown'),
                'bikeType': item.get('bikeType', {}).get('S', 'Unknown')
            }
            bookings.append(booking)
        
        # Sort bookings by creation date (newest first)
        bookings.sort(key=lambda x: x['createdAt'], reverse=True)
        
        logger.info(f"Retrieved {len(bookings)} bookings for user {user_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps({
                'bookings': bookings,
                'count': len(bookings),
                'userEmail': user_email,
                'isAdmin': is_admin
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in get_bookings_lambda: {str(e)}")
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