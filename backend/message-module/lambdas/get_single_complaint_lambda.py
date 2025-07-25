import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE_NAME"])

cognito = boto3.client("cognito-idp")

def lambda_handler(event, context):
    logger.info("Event: %s", json.dumps(event))

    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        user_id = claims["sub"]
        groups = claims.get("cognito:groups", [])
        is_franchise = "BikeFranchise" in groups

        complaint_id = event["pathParameters"]["id"]

        # Fetch the complaint by ID
        response = table.get_item(Key={"messageId": complaint_id})
        item = response.get("Item")

        if not item:
            return {"statusCode": 404, "body": json.dumps({"error": "Complaint not found."})}

        # Access control
        if not (user_id == item["userId"] or user_id == item["assignedFranchiseId"]):
            return {"statusCode": 403, "body": json.dumps({"error": "Unauthorized to view this complaint."})}

        # If the requester is the assigned franchise, fetch user email
        if is_franchise and user_id == item["assignedFranchiseId"]:
            try:
                user_info = cognito.admin_get_user(
                    UserPoolId=os.environ["USER_POOL_ID"],
                    Username=item["userId"]
                )
                user_email = next(
                    (attr["Value"] for attr in user_info["UserAttributes"] if attr["Name"] == "email"),
                    None
                )
                item["userEmail"] = user_email
            except Exception as e:
                logger.warning("Unable to fetch user email: %s", str(e))
        
        return {
            "statusCode": 200,
            "body": json.dumps(item)
        }

    except Exception as e:
        logger.error("Error retrieving complaint thread: %s", str(e), exc_info=True)
        return {"statusCode": 500, "body": json.dumps({"error": "Internal Server Error"})}