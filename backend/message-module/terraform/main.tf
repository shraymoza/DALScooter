data "aws_caller_identity" "current" {}

resource "aws_sns_topic" "complaint_topic" {
  name = "complaint-topic"
}

resource "aws_dynamodb_table" "complaint_logs" {
  name         = "ComplaintLogs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "messageId"

  attribute {
    name = "messageId"
    type = "S"
  }
}

data "archive_file" "submit_complaint_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/submit_complaint_lambda.py"
  output_path = "${path.module}/../lambdas/submit_complaint_lambda.zip"
}

resource "aws_lambda_function" "submit_complaint" {
  function_name = "DALScooter_Submit_complaint_lambda"
  runtime       = "python3.12"
  handler       = "submit_complaint_lambda.lambda_handler"
  filename      = data.archive_file.submit_complaint_zip.output_path
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.complaint_topic.arn
    }
  }
}

data "archive_file" "route_complaint_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/route_complaint_lambda.py"
  output_path = "${path.module}/../lambdas/route_complaint_lambda.zip"
}

resource "aws_lambda_function" "route_complaint" {
  function_name = "DALScooter_Route_complaint_lambda"
  runtime       = "python3.12"
  handler       = "route_complaint_lambda.lambda_handler"
  filename      = data.archive_file.route_complaint_zip.output_path
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.complaint_logs.name
      USER_POOL_ID        = var.cognito_user_pool_id
    }
  }
}

data "archive_file" "get_complaints_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/get_complaints_lambda.py"
  output_path = "${path.module}/../lambdas/get_complaints_lambda.zip"
}

resource "aws_lambda_function" "get_complaints" {
  function_name = "DALScooter_Get_complaints_lambda"
  runtime       = "python3.12"
  handler       = "get_complaints_lambda.lambda_handler"
  filename      = data.archive_file.get_complaints_zip.output_path
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.complaint_logs.name
    }
  }
}

data "archive_file" "reply_complaint_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/reply_complaint_lambda.py"
  output_path = "${path.module}/../lambdas/reply_complaint_lambda.zip"
}

resource "aws_lambda_function" "reply_complaint" {
  function_name = "DALScooter_Reply_complaint_lambda"
  runtime       = "python3.12"
  handler       = "reply_complaint_lambda.lambda_handler"
  filename      = data.archive_file.reply_complaint_zip.output_path
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.complaint_logs.name
    }
  }
}

data "archive_file" "get_single_complaint_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/get_single_complaint_lambda.py"
  output_path = "${path.module}/../lambdas/get_single_complaint_lambda.zip"
}

resource "aws_lambda_function" "get_single_complaint" {
  function_name = "DALScooter_Get_single_complaint_lambda"
  runtime       = "python3.12"
  handler       = "get_single_complaint_lambda.lambda_handler"
  filename      = data.archive_file.get_single_complaint_zip.output_path
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  timeout       = 60

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.complaint_logs.name
      USER_POOL_ID        = var.cognito_user_pool_id
    }
  }
}

resource "aws_sns_topic_subscription" "lambda_sub" {
  topic_arn = aws_sns_topic.complaint_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.route_complaint.arn
}

resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.route_complaint.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.complaint_topic.arn
}

# --- HTTP API Gateway ---
resource "aws_apigatewayv2_api" "complaint_api" {
  name          = "complaint-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS", "GET","PUT","DELETE"]
    allow_headers = ["*"]
    expose_headers = ["*"]
    max_age        = 3600
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.complaint_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.submit_complaint.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_complaints_lambda_integration" {
  api_id             = aws_apigatewayv2_api.complaint_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_complaints.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "reply_complaint_lambda_integration" {
  api_id             = aws_apigatewayv2_api.complaint_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.reply_complaint.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_single_complaint_lambda_integration" {
  api_id             = aws_apigatewayv2_api.complaint_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_single_complaint.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  name            = "complaint-authorizer"
  api_id          = aws_apigatewayv2_api.complaint_api.id
  authorizer_type = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

resource "aws_apigatewayv2_route" "submit_complaint_route" {
  api_id    = aws_apigatewayv2_api.complaint_api.id
  route_key = "POST /submit-complaint"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "get_complaints_route" {
  api_id             = aws_apigatewayv2_api.complaint_api.id
  route_key          = "GET /complaints"
  target             = "integrations/${aws_apigatewayv2_integration.get_complaints_lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "reply_complaint_route" {
  api_id             = aws_apigatewayv2_api.complaint_api.id
  route_key          = "POST /complaints/{id}/reply"
  target             = "integrations/${aws_apigatewayv2_integration.reply_complaint_lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "get_single_complaint_route" {
  api_id             = aws_apigatewayv2_api.complaint_api.id
  route_key          = "GET /complaints/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.get_single_complaint_lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.complaint_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_complaint.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.complaint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_apigw_get" {
  statement_id  = "AllowExecutionFromAPIGatewayGetComplaints"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_complaints.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.complaint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_apigw_reply" {
  statement_id  = "AllowExecutionFromAPIGatewayReply"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reply_complaint.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.complaint_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_apigw_get_single" {
  statement_id  = "AllowFromAPIGWGetComplaintDetail"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_single_complaint.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.complaint_api.execution_arn}/*/*"
}