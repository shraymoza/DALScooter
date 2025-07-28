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

        if method == "GET" and path.startswith("/bikes/") and path.endswith("/availability"):
            bike_id = path_params.get("bikeId")
            return check_bike_availability(bike_id, event.get("queryStringParameters", {}) or {})

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

def check_bike_availability(bike_id, query_params):
    """
    Check if a bike is available for a given time period
    Query parameters: startDate, endDate (ISO 8601 format)
    """
    try:
        if not bike_id:
            return respond(400, {"error": "Missing bikeId"})
        
        start_date = query_params.get("startDate")
        end_date = query_params.get("endDate")
        
        if not start_date or not end_date:
            return respond(400, {"error": "Missing startDate or endDate parameters"})
        
        # First check if the bike exists
        bike_response = table.get_item(Key={"bikeId": bike_id})
        if "Item" not in bike_response:
            return respond(404, {"error": "Bike not found"})
        
        bike = bike_response["Item"]
        
        # Check for booking conflicts by querying the bookings table
        # We need to import boto3.client for this
        import boto3
        dynamodb_client = boto3.client('dynamodb')
        bookings_table = os.environ.get("BOOKINGS_TABLE", "DALScooterBookings")
        
        try:
            # Query for conflicting bookings
            conflict_query_params = {
                'TableName': bookings_table,
                'IndexName': 'BikeBookingsIndex',
                'KeyConditionExpression': 'bikeId = :bikeId',
                'FilterExpression': '#status = :status AND startDate <= :endDate AND endDate >= :startDate',
                'ExpressionAttributeNames': {
                    '#status': 'status'
                },
                'ExpressionAttributeValues': {
                    ':bikeId': {'S': bike_id},
                    ':status': {'S': 'active'},
                    ':startDate': {'S': start_date},
                    ':endDate': {'S': end_date}
                }
            }
            
            conflict_response = dynamodb_client.query(**conflict_query_params)
            
            if conflict_response.get('Items'):
                # Bike is not available due to conflicting bookings
                conflicting_booking = conflict_response['Items'][0]
                return respond(200, {
                    "available": False,
                    "reason": "Bike is already booked for this time period",
                    "bike": bike,
                    "conflictingBooking": {
                        "startDate": conflicting_booking['startDate']['S'],
                        "endDate": conflicting_booking['endDate']['S']
                    }
                })
            else:
                # Bike is available for the requested time period
                return respond(200, {
                    "available": True,
                    "bike": bike,
                    "message": "Bike is available for the requested time period"
                })
                
        except Exception as e:
            logger.error(f"Error checking booking conflicts: {str(e)}")
            # If we can't check conflicts, assume bike is available
            return respond(200, {
                "available": True,
                "bike": bike,
                "message": "Bike appears to be available (conflict check failed)"
            })
        
    except Exception as e:
        logger.error(f"Error checking bike availability: {str(e)}")
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
            "status": body.get("status", "available"),  # Default status to available
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