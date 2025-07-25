import json
import boto3
import os
import uuid
from datetime import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['FEEDBACK_TABLE']
table = dynamodb.Table(table_name)

def analyze_sentiment(text):
    positive_keywords = ['good', 'great', 'excellent', 'awesome', 'love', 'nice', 'happy']
    negative_keywords = ['bad', 'poor', 'terrible', 'hate', 'worst', 'awful', 'disappointed']
    
    text_lower = text.lower()
    score = 0
    for word in positive_keywords:
        if word in text_lower:
            score += 1
    for word in negative_keywords:
        if word in text_lower:
            score -= 1

    if score > 0:
        return 'Positive'
    elif score < 0:
        return 'Negative'
    else:
        return 'Neutral'

def lambda_handler(event, context):
    try:
        logger.info(f"Incoming event: {json.dumps(event)}")
        body = json.loads(event['body'])
        logger.info(f"Body: {body}")

        bike_id = body['bikeId']
        model = body['model']
        user_email = event["requestContext"]["authorizer"]["claims"]["email"]
        comment = body['comment']
        vehicle_type = body['type']
        rating = body.get('rating', None)

        sentiment = analyze_sentiment(comment)

        item = {
            'feedbackId': str(uuid.uuid4()),
            'bikeId': bike_id,
            'model': model,
            'type': vehicle_type,
            'userEmail': user_email,
            'comment': comment,
            'sentiment': sentiment,
            'timestamp': datetime.utcnow().isoformat()
        }

        if rating is not None:
            item['rating'] = str(rating)

        logger.info(f"Storing feedback: {item}")
        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Feedback submitted successfully', 'sentiment': sentiment})
        }

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }