provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

resource "aws_amplify_app" "dalscooter_app" {
  name         = "dalscooter-frontend"
  repository   = "https://github.com/shraymoza/DALScooter.git"
  access_token = var.github_token

  build_spec = <<EOT
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - nvm install 20
        - nvm use 20
        - node -v
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
EOT

  environment_variables = {
    VITE_API_BASE_URL              = var.auth_api_gateway_endpoint
    VITE_COGNITO_USER_POOL_ID     = var.auth_user_pool_id
    VITE_COGNITO_USER_POOL_CLIENT = var.auth_user_pool_client_id
    VITE_AWS_REGION               = var.aws_region
    VITE_BIKE_CRUD_API            = var.bike_crud_api
    VITE_FEEDBACK_API             = var.feedback_api
    VITE_COMPLAINT_API            = var.complaint_api
    VITE_BOOKING_API              = var.booking_api
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.dalscooter_app.id
  branch_name = "main"
}