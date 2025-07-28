provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# Data source to package Question-Answer Lambda
data "archive_file" "question_answer_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/question_answer_lambda.py"
  output_path = "${path.module}/../lambdas/question_answer_lambda.zip"
}

# Data source to package Caesar Cipher Lambda
data "archive_file" "caesar_cipher_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/caesar_cipher_lambda.py"
  output_path = "${path.module}/../lambdas/caesar_cipher_lambda.zip"
}

# Lambda: store_qa_lambda
data "archive_file" "store_qa_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/store_qa_lambda.py"
  output_path = "${path.module}/../lambdas/store_qa_lambda.zip"
}

data "archive_file" "registration_notification_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/registration_notification_lambda.py"
  output_path = "${path.module}/../lambdas/registration_notification_lambda.zip"
}

data "archive_file" "login_notification_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/login_notification_lambda.py"
  output_path = "${path.module}/../lambdas/login_notification_lambda.zip"
}

# DynamoDB Table for User Details
resource "aws_dynamodb_table" "dalscooter_users" {
  name           = "DALScooterUsers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Name = "DALScooterUsers"
  }
}

# Cognito User Pool
resource "aws_cognito_user_pool" "dalscooter_user_pool" {
  name = "DALScooterUserPool"
  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
  }

  lambda_config {
    define_auth_challenge         = aws_lambda_function.custom_auth_lambda.arn
    create_auth_challenge         = aws_lambda_function.custom_auth_lambda.arn
    verify_auth_challenge_response = aws_lambda_function.custom_auth_lambda.arn
  }

  tags = {
    Name = "DALScooterUserPool"
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "dalscooter_client" {
  name         = "DALScooterClient"
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  generate_secret = false
}

resource "aws_cognito_user_group" "registered_customers" {
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id
  name         = "RegisteredCustomers"
  description  = "Group for registered customers"
  precedence   = 1
}

resource "aws_cognito_user_group" "bike_franchise" {
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id
  name         = "BikeFranchise"
  description  = "Group for franchise operators (admin users)"
  precedence   = 2
}

# Question-Answer Lambda Function
resource "aws_lambda_function" "custom_auth_lambda" {
  filename      = data.archive_file.question_answer_lambda_zip.output_path
  function_name = "DALScooterCustomAuthLambda"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler       = "question_answer_lambda.lambda_handler"
  runtime       = "python3.9"
  timeout       = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.dalscooter_users.name
      # SNS_TOPIC_ARN  = aws_sns_topic.authentication_sns_topic.arn
    }
  }

  depends_on = [data.archive_file.question_answer_lambda_zip]
}

# Caesar Cipher Lambda Function
resource "aws_lambda_function" "caesar_cipher_lambda" {
  filename      = data.archive_file.caesar_cipher_lambda_zip.output_path
  function_name = "DALScooterCaesarCipherLambda"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler       = "caesar_cipher_lambda.handler"
  runtime       = "python3.9"
  timeout       = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.dalscooter_users.name
      # SNS_TOPIC_ARN  = aws_sns_topic.authentication_sns_topic.arn
    }
  }

  depends_on = [data.archive_file.caesar_cipher_lambda_zip]
}

resource "aws_lambda_function" "registration_notification_lambda" {
  function_name = "DALScooterRegistrationNotificationLambda"
  filename      = data.archive_file.registration_notification_lambda_zip.output_path
  handler       = "registration_notification_lambda.handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.authentication_sns_topic.arn
    }
  }
}

resource "aws_lambda_function" "login_notification_lambda" {
  function_name = "DALScooterLoginNotificationLambda"
  filename      = data.archive_file.login_notification_lambda_zip.output_path
  handler       = "login_notification_lambda.handler"
  runtime       = "python3.11"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.authentication_sns_topic.arn
      USER_POOL_ID  = aws_cognito_user_pool.dalscooter_user_pool.id
    }
  }
}

resource "aws_lambda_permission" "allow_cognito_custom_auth" {
  statement_id  = "AllowExecutionFromCognitoCustomAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_auth_lambda.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

resource "aws_lambda_permission" "cognito_invoke_caesar_cipher" {
  statement_id  = "AllowCognitoInvokeCaesarCipher"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.caesar_cipher_lambda.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

# HTTP API Gateway for Lambda Integration
resource "aws_apigatewayv2_api" "dalscooter_http_api" {
  name          = "DALScooterHTTPAPI"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS", "GET"]
    allow_headers = ["*"]
    expose_headers = ["*"]
    max_age        = 3600
  }
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.dalscooter_http_api.id
  name        = "$default"
  auto_deploy = true
}

# Lambda Permission for API Gateway HTTP
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_auth_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.dalscooter_http_api.execution_arn}/*/*"
}

resource "aws_lambda_function" "store_qa_lambda" {
  function_name = "DALScooterStoreQALambda"
  filename      = data.archive_file.store_qa_lambda_zip.output_path
  handler       = "store_qa_lambda.handler"
  runtime       = "python3.9"
  role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.dalscooter_users.name
      REGISTRATION_QUEUE_URL = aws_sqs_queue.registration_email_queue.id
      SNS_TOPIC_ARN         = aws_sns_topic.authentication_sns_topic.arn
    }
  }

  depends_on = [data.archive_file.store_qa_lambda_zip]
}

resource "aws_apigatewayv2_integration" "store_qa_integration" {
  api_id             = aws_apigatewayv2_api.dalscooter_http_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.store_qa_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "store_qa_route" {
  api_id    = aws_apigatewayv2_api.dalscooter_http_api.id
  route_key = "POST /store-qa"
  target    = "integrations/${aws_apigatewayv2_integration.store_qa_integration.id}"
}

resource "aws_lambda_permission" "store_qa_api_permission" {
  statement_id  = "AllowInvokeStoreQALambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.store_qa_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.dalscooter_http_api.execution_arn}/*/*"
}

resource "aws_sns_topic" "authentication_sns_topic" {
  name = "dalscooter_sns_topic"
}

resource "aws_sqs_queue" "registration_email_queue" {
  name                      = "registration_email_queue"
  delay_seconds             = 60
  message_retention_seconds = 300
}

resource "aws_sns_topic_subscription" "registration_sqs_sub" {
  topic_arn = aws_sns_topic.authentication_sns_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.registration_email_queue.arn
}

resource "aws_sqs_queue_policy" "allow_sns_to_sqs" {
  queue_url = aws_sqs_queue.registration_email_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.registration_email_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.authentication_sns_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_lambda_event_source_mapping" "trigger_lambda_from_sqs" {
  event_source_arn = aws_sqs_queue.registration_email_queue.arn
  function_name    = aws_lambda_function.registration_notification_lambda.function_name
  batch_size       = 1
  enabled          = true
}