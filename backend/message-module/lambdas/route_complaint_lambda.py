import json
import boto3
import os
import random
import uuid
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Received SNS event: %s", json.dumps(event))

    try:
        message = json.loads(event["Records"][0]["Sns"]["Message"])
        logger.info("Parsed message: %s", message)

        cognito = boto3.client("cognito-idp")
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(os.environ["DYNAMODB_TABLE_NAME"])

        response = cognito.list_users_in_group(
            UserPoolId=os.environ["USER_POOL_ID"],
            GroupName="BikeFranchise"
        )
        franchise_users = response["Users"]
        logger.info("Fetched franchise users: %s", franchise_users)

        selected = random.choice(franchise_users)
        logger.info("Selected franchise user: %s", selected)

        assignedFranchiseId = next(attr['Value'] for attr in selected['Attributes'] if attr['Name'] == 'sub')
        assignedFranchiseEmail = next((attr['Value'] for attr in selected['Attributes'] if attr['Name'] == 'email'), None)

        log_entry = {
            "messageId": message["messageId"],
            "bookingRef": message["bookingRef"],
            "userId": message["userId"],
            "complaint": message["complaint"],
            "assignedFranchiseId": assignedFranchiseId,
            "assignedFranchiseEmail": assignedFranchiseEmail,
            "timestampUTC": datetime.utcnow().isoformat() + "Z",
            "status": "forwarded"
        }

        logger.info("Logging complaint to DynamoDB: %s", log_entry)

        table.put_item(Item=log_entry)

        return {"statusCode": 200}

    except Exception as e:
        logger.error("Error processing complaint: %s", str(e), exc_info=True)
        return {"statusCode": 500}