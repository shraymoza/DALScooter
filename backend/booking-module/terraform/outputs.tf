output "booking_api_endpoint" {
  description = "Booking API Gateway endpoint"
  value       = aws_apigatewayv2_stage.booking_stage.invoke_url
}

output "bookings_table_name" {
  description = "DynamoDB bookings table name"
  value       = aws_dynamodb_table.bookings_table.name
}

output "booking_api_id" {
  description = "Booking API Gateway ID"
  value       = aws_apigatewayv2_api.booking_api.id
} 