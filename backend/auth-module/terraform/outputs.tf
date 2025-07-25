output "user_pool_id" {
  value = aws_cognito_user_pool.dalscooter_user_pool.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.dalscooter_client.id
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.dalscooter_users.name
}

output "api_gateway_endpoint" {
  value = aws_apigatewayv2_api.dalscooter_http_api.api_endpoint
}

output "authentication_sns_topic_arn" {
  value = aws_sns_topic.authentication_sns_topic.arn
}