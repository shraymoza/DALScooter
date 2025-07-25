import json
import os
import boto3
import logging
from boto3.dynamodb.conditions import Key, Attr

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE_NAME"])

def lambda_handler(event, context):
    logger.info("Incoming event: %s", json.dumps(event))

    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        user_id = claims["sub"]
        query_params = event.get("queryStringParameters", {}) or {}
        role = query_params.get("role", "user").lower()

        logger.info("Caller role: %s | Cognito sub: %s", role, user_id)

        # Filter by assignedFranchiseId if role is franchise
        if role == "franchise":
            filter_expr = Attr("assignedFranchiseId").eq(user_id)
        else:
            filter_expr = Attr("userId").eq(user_id)

        # Scan with filter (assuming PAY_PER_REQUEST, no GSI needed)
        response = table.scan(
            FilterExpression=filter_expr
        )
        items = response.get("Items", [])
        logger.info("Fetched %d complaint(s)", len(items))

        return {
            "statusCode": 200,
            "body": json.dumps(items)
        }

    except Exception as e:
        logger.error("Error retrieving complaints: %s", str(e), exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal Server Error"})
        }