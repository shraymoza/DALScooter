import json
import boto3
import os
import logging
from datetime import datetime
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE_NAME"])

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))

    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        user_id = claims["sub"]
        groups = claims.get("cognito:groups", [])
        is_franchise = "BikeFranchise" in groups

        if not is_franchise:
            return {"statusCode": 403, "body": json.dumps({"error": "Forbidden. Not a franchise user."})}

        path_params = event["pathParameters"]
        complaint_id = path_params.get("id")
        body = json.loads(event["body"])
        reply_message = body.get("message")

        if not reply_message:
            return {"statusCode": 400, "body": json.dumps({"error": "Missing reply message."})}

        # Get complaint from DynamoDB
        response = table.get_item(Key={"messageId": complaint_id})
        complaint = response.get("Item")

        if not complaint:
            return {"statusCode": 404, "body": json.dumps({"error": "Complaint not found."})}

        if complaint.get("assignedFranchiseId") != user_id:
            return {"statusCode": 403, "body": json.dumps({"error": "You are not assigned to this complaint."})}

        # Append new response
        new_response = {
            "responderId": user_id,
            "message": reply_message,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        updated_responses = complaint.get("responses", [])
        updated_responses.append(new_response)

        table.update_item(
            Key={"messageId": complaint_id},
            UpdateExpression="SET #r = :r, #s = :s",
            ExpressionAttributeNames={
                "#r": "responses",
                "#s": "status"
            },
            ExpressionAttributeValues={
                ":r": updated_responses,
                ":s": "answered"
            }
        )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Reply submitted successfully."})
        }

    except Exception as e:
        logger.error("Error replying to complaint: %s", str(e), exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal Server Error"})
        }