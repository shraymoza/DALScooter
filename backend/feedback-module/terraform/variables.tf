variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "feedback_table_name" {
  default = "FeedbackTable"
}

variable "submit_feedback_lambda_name" {
  default = "DALScooterSubmitFeedbackLambda"
}

variable "get_feedback_lambda_name" {
  default = "DALScooterGetFeedbackLambda"
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Cognito App Client ID"
  type        = string
}