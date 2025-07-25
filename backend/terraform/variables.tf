variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "github_token" {
  description = "GitHub Personal Access Token (used by Amplify)"
  type        = string
  sensitive   = true
}