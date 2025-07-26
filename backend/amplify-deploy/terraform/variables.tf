variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "github_token" {
  description = "GitHub access token"
  type        = string
  sensitive   = true
}

variable "auth_api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  type        = string
}

variable "auth_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "auth_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "bike_crud_api" {
  description = "Bike CRUD API"
  type        = string
}

variable "feedback_api" {
  description = "Feedback CRUD API"
  type        = string
}

variable "complaint_api" {
  description = "Complaint CRUD API"
  type        = string
}

variable "booking_api" {
  description = "Booking CRUD API"
  type        = string
}