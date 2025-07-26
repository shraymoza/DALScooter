provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# Data sources to package Lambda functions
data "archive_file" "create_booking_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/create_booking_lambda.py"
  output_path = "${path.module}/../lambdas/create_booking_lambda.zip"
}

data "archive_file" "get_user_bookings_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/get_user_bookings_lambda.py"
  output_path = "${path.module}/../lambdas/get_user_bookings_lambda.zip"
}

data "archive_file" "cancel_booking_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/cancel_booking_lambda.py"
  output_path = "${path.module}/../lambdas/cancel_booking_lambda.zip"
}

data "archive_file" "get_available_vehicles_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/get_available_vehicles_lambda.py"
  output_path = "${path.module}/../lambdas/get_available_vehicles_lambda.zip"
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

  tags = {
    Project = "DALScooter"
    Module  = "Booking"
  }
}



# Create Booking Lambda
resource "aws_lambda_function" "create_booking_lambda" {
  filename         = data.archive_file.create_booking_lambda_zip.output_path
  function_name    = "DALScooterCreateBookingLambda"
  role            = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler         = "create_booking_lambda.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
      BIKES_TABLE    = "DALScooterBikes"
    }
  }

  depends_on = [data.archive_file.create_booking_lambda_zip]

  tags = {
    Project = "DALScooter"
    Module  = "Booking"
  }
}

# Get User Bookings Lambda
resource "aws_lambda_function" "get_user_bookings_lambda" {
  filename         = data.archive_file.get_user_bookings_lambda_zip.output_path
  function_name    = "DALScooterGetUserBookingsLambda"
  role            = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler         = "get_user_bookings_lambda.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
    }
  }

  depends_on = [data.archive_file.get_user_bookings_lambda_zip]

  tags = {
    Project = "DALScooter"
    Module  = "Booking"
  }
}

# Cancel Booking Lambda
resource "aws_lambda_function" "cancel_booking_lambda" {
  filename         = data.archive_file.cancel_booking_lambda_zip.output_path
  function_name    = "DALScooterCancelBookingLambda"
  role            = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler         = "cancel_booking_lambda.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
    }
  }

  depends_on = [data.archive_file.cancel_booking_lambda_zip]

  tags = {
    Project = "DALScooter"
    Module  = "Booking"
  }
}

# Get Available Vehicles Lambda
resource "aws_lambda_function" "get_available_vehicles_lambda" {
  filename         = data.archive_file.get_available_vehicles_lambda_zip.output_path
  function_name    = "DALScooterGetAvailableVehiclesLambda"
  role            = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler         = "get_available_vehicles_lambda.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings_table.name
      BIKES_TABLE    = "DALScooterBikes"
    }
  }

  depends_on = [data.archive_file.get_available_vehicles_lambda_zip]

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
    allow_headers = ["*"]
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "booking_stage" {
  api_id = aws_apigatewayv2_api.booking_api.id
  name   = "prod"
  auto_deploy = true
}

# API Gateway Integration for Create Booking
resource "aws_apigatewayv2_integration" "create_booking_integration" {
  api_id           = aws_apigatewayv2_api.booking_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.create_booking_lambda.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway Integration for Get User Bookings
resource "aws_apigatewayv2_integration" "get_user_bookings_integration" {
  api_id           = aws_apigatewayv2_api.booking_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_user_bookings_lambda.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway Integration for Cancel Booking
resource "aws_apigatewayv2_integration" "cancel_booking_integration" {
  api_id           = aws_apigatewayv2_api.booking_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.cancel_booking_lambda.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway Integration for Get Available Vehicles
resource "aws_apigatewayv2_integration" "get_available_vehicles_integration" {
  api_id           = aws_apigatewayv2_api.booking_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_available_vehicles_lambda.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "create_booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "POST /bookings"
  target    = "integrations/${aws_apigatewayv2_integration.create_booking_integration.id}"
}

resource "aws_apigatewayv2_route" "get_user_bookings_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "GET /bookings"
  target    = "integrations/${aws_apigatewayv2_integration.get_user_bookings_integration.id}"
}

resource "aws_apigatewayv2_route" "cancel_booking_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "DELETE /bookings/{bookingId}"
  target    = "integrations/${aws_apigatewayv2_integration.cancel_booking_integration.id}"
}

resource "aws_apigatewayv2_route" "get_available_vehicles_route" {
  api_id    = aws_apigatewayv2_api.booking_api.id
  route_key = "GET /available-vehicles"
  target    = "integrations/${aws_apigatewayv2_integration.get_available_vehicles_integration.id}"
}

# Lambda Permissions
resource "aws_lambda_permission" "create_booking_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_user_bookings_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_bookings_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "cancel_booking_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cancel_booking_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_available_vehicles_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_available_vehicles_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.booking_api.execution_arn}/*/*"
} 