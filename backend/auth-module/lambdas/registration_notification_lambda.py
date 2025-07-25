import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')
TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    for record in event.get('Records', []):
        try:
            logger.info(f"Raw SQS message: {record['body']}")
            message = json.loads(record['body'])
            logger.info(f"Processing message: {message}")

            email = message['email']
            msg_type = message.get('type', 'registration')

            subject = "Welcome to DALScooter!" if msg_type == "registration" else "DALScooter Login Alert"
            msg = f"Hi {email}, your registration was successful. Welcome aboard!" if msg_type == "registration" else f"Hi {email}, your login was successful."

            sns.publish(
                TopicArn=TOPIC_ARN,
                Subject=subject,
                Message=msg
            )

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)