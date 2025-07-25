import json
import boto3
import os
import uuid
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))

    try:
        body = json.loads(event["body"])
        sns = boto3.client("sns")

        user_id = event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
        logger.info("Extracted userId from JWT: %s", user_id)

        message = {
            "messageId": str(uuid.uuid4()),
            "bookingRef": body["bookingRef"],
            "userId": user_id,
            "complaint": body["complaint"]
        }

        logger.info("Publishing message to SNS: %s", message)

        sns.publish(
            TopicArn=os.environ["SNS_TOPIC_ARN"],
            Message=json.dumps(message)
        )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Complaint submitted."})
        }

    except Exception as e:
        logger.error("Error submitting complaint: %s", str(e), exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal Server Error"})
        }
