provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# Data source to package Lambda function
data "archive_file" "booking_crud_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/booking_crud_handler.py"
  output_path = "${path.module}/../lambdas/booking_crud_handler.zip"
}

# DynamoDB Table for Bookings
resource "aws_dynamodb_table" "bookings_table" {
  name           = "DALScooterBookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bookingId"
  range_key      = "userId"

  attribute {
    name = "bookingId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "bikeId"
    type = "S"
  }

  attribute {
    name = "bookingDate"
    type = "S"
  }

  global_secondary_index {
    name            = "BikeIdIndex"
    hash_key        = "bikeId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "BookingDateIndex"
    hash_key        = "bookingDate"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Project = "DALScooter"
    Module  = "Booking"
  }
}



# Booking CRUD Lambda (Single handler for all operations)
resource "aws_lambda_function" "booking_crud_lambda" {
  filename         = data.archive_file.booking_crud_lambda_zip.output_path
  function_name    = "DALScooterBookingCrudLambda"
  role            = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler         = "booking_crud_handler.lambda_handler"
  runtime         = "python3.9"
  timeout         = 60

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
      BIKES_TABLE    = "BikeInventoryTable"
    }
  }

  depends_on = [data.archive_file.booking_crud_lambda_zip]

  tags = {
    Project = "DALScooter"
    Module  = "Booking"
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "booking_api" {
  name          = "DALScooterBookingAPI"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*", "Authorization", "Content-Type"]
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "booking_stage" {
  api_id = aws_apigatewayv2_api.booking_api.id
  name   = "prod"
  auto_deploy = true
}

# API Gateway Integration (Single integration for all routes)
resource "aws_apigatewayv2_integration" "booking_crud_integration" {
  api_id           = aws_apigatewayv2_api.booking_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.booking_crud_lambda.invoke_arn
  payload_format_version = "2.0"
}

# Cognito Authorizer for JWT
resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  name          = "BookingCognitoAuthorizer"
  api_id        = aws_apigatewayv2_api.booking_api.id
  authorizer_type = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# API Gateway Routes (All routes use single integration)
resource "aws_apigatewayv2_route" "create_booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "POST /bookings"
  target    = "integrations/${aws_apigatewayv2_integration.booking_crud_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "get_user_bookings_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "GET /bookings"
  target    = "integrations/${aws_apigatewayv2_integration.booking_crud_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "cancel_booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "DELETE /bookings/{bookingId}"
  target    = "integrations/${aws_apigatewayv2_integration.booking_crud_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "get_available_vehicles_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "GET /available-vehicles"
  target    = "integrations/${aws_apigatewayv2_integration.booking_crud_integration.id}"
}

# Lambda Permission (Single permission for all routes)
resource "aws_lambda_permission" "booking_crud_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.booking_crud_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
} 