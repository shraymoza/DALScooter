variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "User Pool ID"
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "User Pool Client ID"
  type        = string
}