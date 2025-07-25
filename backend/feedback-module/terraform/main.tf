data "aws_caller_identity" "current" {}

provider "aws" {
  region = "us-east-1"
}

# Archive submit feedback lambda
data "archive_file" "submit_feedback_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/submit_feedback_lambda.py"
  output_path = "${path.module}/../lambdas/submit_feedback_lambda.zip"
}

# Archive get feedback lambda
data "archive_file" "get_feedback_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/get_feedback_lambda.py"
  output_path = "${path.module}/../lambdas/get_feedback_lambda.zip"
}

resource "aws_dynamodb_table" "feedback_table" {
  name         = var.feedback_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "feedbackId"

  attribute {
    name = "feedbackId"
    type = "S"
  }

  tags = {
    Module = "Feedback"
    Project = "DALScooter"
  }
}

resource "aws_lambda_function" "submit_feedback_lambda" {
  function_name = var.submit_feedback_lambda_name
  handler       = "submit_feedback_lambda.lambda_handler"
  runtime       = "python3.11"
  filename      = data.archive_file.submit_feedback_zip.output_path
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"

  environment {
    variables = {
      FEEDBACK_TABLE = aws_dynamodb_table.feedback_table.name
    }
  }
}

resource "aws_lambda_function" "get_feedback_lambda" {
  function_name = var.get_feedback_lambda_name
  handler       = "get_feedback_lambda.lambda_handler"
  runtime       = "python3.11"
  filename      = data.archive_file.get_feedback_zip.output_path
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"

  environment {
    variables = {
      FEEDBACK_TABLE = aws_dynamodb_table.feedback_table.name
    }
  }
}

resource "aws_apigatewayv2_api" "feedback_api" {
  name          = "feedback-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS", "GET","PUT","DELETE"]
    allow_headers = ["*"]
    expose_headers = ["*"]
    max_age        = 3600
  }
}

resource "aws_apigatewayv2_integration" "submit_feedback_integration" {
  api_id             = aws_apigatewayv2_api.feedback_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.submit_feedback_lambda.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  name                            = "feedback-authorizer"
  api_id                          = aws_apigatewayv2_api.feedback_api.id
  authorizer_type                 = "JWT"
  identity_sources                = ["$request.header.Authorization"]
  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

resource "aws_apigatewayv2_route" "submit_feedback_route" {
  api_id             = aws_apigatewayv2_api.feedback_api.id
  route_key          = "POST /submit-feedback"
  target             = "integrations/${aws_apigatewayv2_integration.submit_feedback_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_lambda_permission" "submit_feedback_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_feedback_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.feedback_api.execution_arn}/*/*"
}

# Repeat for GET Lambda
resource "aws_apigatewayv2_integration" "get_feedback_integration" {
  api_id                 = aws_apigatewayv2_api.feedback_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_feedback_lambda.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_feedback_route" {
  api_id    = aws_apigatewayv2_api.feedback_api.id
  route_key = "GET /get-feedback"
  target    = "integrations/${aws_apigatewayv2_integration.get_feedback_integration.id}"
}

resource "aws_lambda_permission" "get_feedback_permission" {
  statement_id  = "AllowAPIGatewayInvokeGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_feedback_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.feedback_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.feedback_api.id
  name        = "$default"
  auto_deploy = true
}