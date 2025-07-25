output "feedback_api_endpoint" {
  value = aws_apigatewayv2_api.feedback_api.api_endpoint
}

output "feedback_table_name" {
  value = aws_dynamodb_table.feedback_table.name
}