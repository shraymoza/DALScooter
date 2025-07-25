import json
import boto3
import os
import uuid
import logging
from boto3.dynamodb.conditions import Key
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB setup
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DYNAMODB_TABLE"])

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    method = event["requestContext"]["http"].get("method")
    path = event["rawPath"]
    path_params = event.get("pathParameters") or {}

    try:
        if method == "GET" and path == "/bikes":
            return list_bikes()

        if method == "POST" and path == "/bikes":
            return create_bike(json.loads(event["body"]))

        if method == "PUT" and path.startswith("/bikes/"):
            return update_bike(path_params.get("bikeId"), json.loads(event["body"]))

        if method == "DELETE" and path.startswith("/bikes/"):
            return delete_bike(path_params.get("bikeId"))

        return respond(400, {"message": "Invalid route or method."})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return respond(500, {"error": str(e)})

def list_bikes():
    try:
        response = table.scan()
        logger.info("Listed all bikes successfully.")
        return respond(200, response["Items"])
    except Exception as e:
        logger.error(f"Error listing bikes: {str(e)}")
        return respond(500, {"error": str(e)})

def create_bike(body):
    try:
        bike_id = str(uuid.uuid4())
        item = {
            "bikeId": bike_id,
            "type": body.get("type"),
            "model": body.get("model"),
            "accessCode": body.get("accessCode"),
            "batteryLife": body.get("batteryLife"),
            "hourlyRate": Decimal(str(body.get("hourlyRate", "0"))),
            "discount": body.get("discount", ""),
            "features": body.get("features", []),
            "createdBy": body.get("createdBy"),
            "createdAt": body.get("createdAt")
        }
        table.put_item(Item=item)
        logger.info(f"Created new bike: {bike_id}")
        return respond(201, {"message": "Bike added.", "bikeId": bike_id})
    except Exception as e:
        logger.error(f"Error creating bike: {str(e)}")
        return respond(500, {"error": str(e)})

def update_bike(bike_id, body):
    if not bike_id:
        logger.warning("Missing bikeId for update request.")
        return respond(400, {"message": "Missing bikeId in path."})
    try:
        update_expr = []
        expr_attr_vals = {}
        expr_attr_names = {}
        for key, val in body.items():
            if key == "bikeId":
                continue
            placeholder = f"#{key}" if key.lower() in ["type"] else key
            update_expr.append(f"{placeholder} = :{key}")
            if isinstance(val, float):
                update_expr.append(f"{placeholder} = :{key}")
            else:
                expr_attr_vals[f":{key}"] = val
            
            if key.lower() in ["type"]:
                expr_attr_names[f"#{key}"] = key

        update_params = {
            "Key": {"bikeId": bike_id},
            "UpdateExpression": "SET " + ", ".join(update_expr),
            "ExpressionAttributeValues": expr_attr_vals
        }
        if expr_attr_names:
            update_params["ExpressionAttributeNames"] = expr_attr_names
        table.update_item(**update_params)
        logger.info(f"Updated bike: {bike_id}")
        return respond(200, {"message": "Bike updated."})
    except Exception as e:
        logger.error(f"Error updating bike {bike_id}: {str(e)}")
        return respond(500, {"error": str(e)})

def delete_bike(bike_id):
    if not bike_id:
        logger.warning("Missing bikeId for delete request.")
        return respond(400, {"message": "Missing bikeId in path."})
    try:
        table.delete_item(Key={"bikeId": bike_id})
        logger.info(f"Deleted bike: {bike_id}")
        return respond(200, {"message": "Bike deleted."})
    except Exception as e:
        logger.error(f"Error deleting bike {bike_id}: {str(e)}")
        return respond(500, {"error": str(e)})

def respond(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, cls=DecimalEncoder)
    }