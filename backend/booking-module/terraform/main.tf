data "aws_caller_identity" "current" {}

provider "aws" {
  region = var.aws_region
}

# DynamoDB Table for Bookings
resource "aws_dynamodb_table" "bookings_table" {
  name           = "DALScooterBookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bookingId"

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

  # Global Secondary Index for user bookings
  global_secondary_index {
    name            = "UserBookingsIndex"
    hash_key        = "userId"
    range_key       = "bookingDate"
    projection_type = "ALL"
  }

  # Global Secondary Index for bike availability
  global_secondary_index {
    name            = "BikeBookingsIndex"
    hash_key        = "bikeId"
    range_key       = "bookingDate"
    projection_type = "ALL"
  }

  tags = {
    Environment = "dev"
    Project     = "DALScooter"
    Module      = "Booking"
  }
}

# Archive files for Lambda functions
data "archive_file" "create_booking_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/create_booking_lambda.py"
  output_path = "${path.module}/../lambdas/create_booking_lambda.zip"
}

data "archive_file" "get_bookings_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/get_bookings_lambda.py"
  output_path = "${path.module}/../lambdas/get_bookings_lambda.zip"
}

data "archive_file" "update_booking_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/update_booking_lambda.py"
  output_path = "${path.module}/../lambdas/update_booking_lambda.zip"
}

data "archive_file" "cancel_booking_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/cancel_booking_lambda.py"
  output_path = "${path.module}/../lambdas/cancel_booking_lambda.zip"
}

data "archive_file" "get_booking_details_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/get_booking_details_lambda.py"
  output_path = "${path.module}/../lambdas/get_booking_details_lambda.zip"
}

# Lambda Functions
resource "aws_lambda_function" "create_booking_lambda" {
  function_name = "DALScooterCreateBookingLambda"
  filename      = data.archive_file.create_booking_zip.output_path
  handler       = "create_booking_lambda.lambda_handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60
  source_code_hash = data.archive_file.create_booking_zip.output_base64sha256

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
      BIKE_INVENTORY_TABLE = "BikeInventoryTable"
    }
  }

  depends_on = [data.archive_file.create_booking_zip]
  
  # Force update when source code changes
  tags = {
    LastModified = timestamp()
  }
}

resource "aws_lambda_function" "get_bookings_lambda" {
  function_name = "DALScooterGetBookingsLambda"
  filename      = data.archive_file.get_bookings_zip.output_path
  handler       = "get_bookings_lambda.lambda_handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60
  source_code_hash = data.archive_file.get_bookings_zip.output_base64sha256

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
    }
  }

  depends_on = [data.archive_file.get_bookings_zip]
  
  # Force update when source code changes
  tags = {
    LastModified = timestamp()
  }
}

resource "aws_lambda_function" "update_booking_lambda" {
  function_name = "DALScooterUpdateBookingLambda"
  filename      = data.archive_file.update_booking_zip.output_path
  handler       = "update_booking_lambda.lambda_handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60
  source_code_hash = data.archive_file.update_booking_zip.output_base64sha256

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
    }
  }

  depends_on = [data.archive_file.update_booking_zip]
  
  # Force update when source code changes
  tags = {
    LastModified = timestamp()
  }
}

resource "aws_lambda_function" "cancel_booking_lambda" {
  function_name = "DALScooterCancelBookingLambda"
  filename      = data.archive_file.cancel_booking_zip.output_path
  handler       = "cancel_booking_lambda.lambda_handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60
  source_code_hash = data.archive_file.cancel_booking_zip.output_base64sha256

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
    }
  }

  depends_on = [data.archive_file.cancel_booking_zip]
  
  # Force update when source code changes
  tags = {
    LastModified = timestamp()
  }
}

resource "aws_lambda_function" "get_booking_details_lambda" {
  function_name = "DALScooterGetBookingDetailsLambda"
  filename      = data.archive_file.get_booking_details_zip.output_path
  handler       = "get_booking_details_lambda.lambda_handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60
  source_code_hash = data.archive_file.get_booking_details_zip.output_base64sha256

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
    }
  }

  depends_on = [data.archive_file.get_booking_details_zip]
  
  # Force update when source code changes
  tags = {
    LastModified = timestamp()
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "booking_api" {
  name          = "DALScooterBookingAPI"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS", "GET", "PUT", "DELETE"]
    allow_headers = ["*"]
    expose_headers = ["*"]
    max_age        = 3600
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.booking_api.id
  name        = "$default"
  auto_deploy = true
}

# Cognito Authorizer
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

# Lambda Integrations
resource "aws_apigatewayv2_integration" "create_booking_integration" {
  api_id             = aws_apigatewayv2_api.booking_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.create_booking_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_bookings_integration" {
  api_id             = aws_apigatewayv2_api.booking_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_bookings_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "update_booking_integration" {
  api_id             = aws_apigatewayv2_api.booking_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.update_booking_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "cancel_booking_integration" {
  api_id             = aws_apigatewayv2_api.booking_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.cancel_booking_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_booking_details_integration" {
  api_id             = aws_apigatewayv2_api.booking_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_booking_details_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# API Routes
resource "aws_apigatewayv2_route" "create_booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "POST /bookings"
  target    = "integrations/${aws_apigatewayv2_integration.create_booking_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "get_bookings_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "GET /bookings"
  target    = "integrations/${aws_apigatewayv2_integration.get_bookings_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "update_booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "PUT /bookings/{bookingId}"
  target    = "integrations/${aws_apigatewayv2_integration.update_booking_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "cancel_booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "DELETE /bookings/{bookingId}"
  target    = "integrations/${aws_apigatewayv2_integration.cancel_booking_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "get_booking_details_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "GET /bookings/{bookingId}"
  target    = "integrations/${aws_apigatewayv2_integration.get_booking_details_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

# Lambda Permissions
resource "aws_lambda_permission" "create_booking_permission" {
  statement_id  = "AllowAPIGatewayInvokeCreateBooking"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_bookings_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetBookings"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_bookings_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "update_booking_permission" {
  statement_id  = "AllowAPIGatewayInvokeUpdateBooking"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "cancel_booking_permission" {
  statement_id  = "AllowAPIGatewayInvokeCancelBooking"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cancel_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_booking_details_permission" {
  statement_id  = "AllowAPIGatewayInvokeGetBookingDetails"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_booking_details_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
} 