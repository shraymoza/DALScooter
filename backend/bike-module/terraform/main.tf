data "aws_caller_identity" "current" {}

resource "aws_dynamodb_table" "bike_inventory" {
  name           = "BikeInventoryTable"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bikeId"

  attribute {
    name = "bikeId"
    type = "S"
  }

  tags = {
    Environment = "dev"
    Project     = "DALScooter"
  }
}

resource "aws_lambda_function" "bike_crud_handler" {
  function_name = "DALScooterBikeCrudHandler"
  filename      = data.archive_file.bike_crud.output_path
  source_code_hash = data.archive_file.bike_crud.output_base64sha256
  handler       = "bike_crud_handler.lambda_handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.bike_inventory.name
    }
  }
}

data "archive_file" "bike_crud" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/bike_crud_handler.py"
  output_path = "${path.module}/../lambdas/bike_crud.zip"
}

resource "aws_apigatewayv2_api" "bike_api" {
  name          = "BikeCrudAPI"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS", "GET","PUT","DELETE"]
    allow_headers = ["*"]
    expose_headers = ["*"]
    max_age        = 3600
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.bike_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "bike_lambda_integration" {
  api_id           = aws_apigatewayv2_api.bike_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.bike_crud_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# GET /bikes is PUBLIC (for guest users)
resource "aws_apigatewayv2_route" "get_bikes" {
  api_id    = aws_apigatewayv2_api.bike_api.id
  route_key = "GET /bikes"
  target    = "integrations/${aws_apigatewayv2_integration.bike_lambda_integration.id}"
}

# SECURED routes (POST, PUT, DELETE)
resource "aws_apigatewayv2_route" "post_bike" {
  api_id    = aws_apigatewayv2_api.bike_api.id
  route_key = "POST /bikes"
  target    = "integrations/${aws_apigatewayv2_integration.bike_lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "put_bike" {
  api_id    = aws_apigatewayv2_api.bike_api.id
  route_key = "PUT /bikes/{bikeId}"
  target    = "integrations/${aws_apigatewayv2_integration.bike_lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "delete_bike" {
  api_id    = aws_apigatewayv2_api.bike_api.id
  route_key = "DELETE /bikes/{bikeId}"
  target    = "integrations/${aws_apigatewayv2_integration.bike_lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_lambda_permission" "apigw_bike" {
  statement_id  = "AllowAPIGatewayInvokeBikeCrud"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bike_crud_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.bike_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  name          = "BikeCrudCognitoAuthorizer"
  api_id        = aws_apigatewayv2_api.bike_api.id
  authorizer_type = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}