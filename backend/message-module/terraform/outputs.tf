output "complaint_api_endpoint" {
  value = aws_apigatewayv2_api.complaint_api.api_endpoint
}

output "complaint_table_name" {
  value = aws_dynamodb_table.complaint_logs.name
}