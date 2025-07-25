import json
import boto3
import os
from boto3.dynamodb.conditions import Attr
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['FEEDBACK_TABLE']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        logger.info(f"Incoming event: {json.dumps(event)}")
        query_params = event.get('queryStringParameters') or {}
        model_filter = query_params.get('model') if 'model' in query_params else None

        if model_filter:
            logger.info(f"Fetching feedbacks for model: {model_filter}")
            response = table.scan(
                FilterExpression=Attr('model').eq(model_filter)
            )
        else:
            logger.info("Fetching all feedbacks")
            response = table.scan()

        items = sorted(response['Items'], key=lambda x: x.get('timestamp', ''), reverse=True)

        return {
            'statusCode': 200,
            'body': json.dumps(items)
        }

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }