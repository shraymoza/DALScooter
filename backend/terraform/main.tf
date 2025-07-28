provider "aws" {
  region = var.aws_region
}

# Auth Module
module "auth_module" {
  source     = "../auth-module/terraform"
  aws_region = var.aws_region
}

module "amplify_deploy" {
  source = "../amplify-deploy/terraform"

  aws_region                 = var.aws_region
  github_token              = var.github_token
  auth_api_gateway_endpoint = module.auth_module.api_gateway_endpoint
  auth_user_pool_id         = module.auth_module.user_pool_id
  auth_user_pool_client_id  = module.auth_module.user_pool_client_id
  bike_crud_api             = module.bike_module.bike_api_gateway_endpoint
  feedback_api              = module.feedback_module.feedback_api_endpoint
  complaint_api             = module.message_module.complaint_api_endpoint
  booking_api               = module.booking_module.booking_api_gateway_endpoint
}

# Bike Module (Admin & Guest CRUD access)
module "bike_module" {
  source                     = "../bike-module/terraform"
  aws_region                = var.aws_region
  cognito_user_pool_id      = module.auth_module.user_pool_id
  cognito_user_pool_client_id = module.auth_module.user_pool_client_id
}

# Feedback Module
module "feedback_module" {
  source                        = "../feedback-module/terraform"
  aws_region                    = var.aws_region
  cognito_user_pool_id          = module.auth_module.user_pool_id
  cognito_user_pool_client_id   = module.auth_module.user_pool_client_id
}

module "message_module" {
  source                        = "../message-module/terraform"
  aws_region                    = var.aws_region
  cognito_user_pool_id          = module.auth_module.user_pool_id
  cognito_user_pool_client_id   = module.auth_module.user_pool_client_id
}

# Booking Module
module "booking_module" {
  source                        = "../booking-module/terraform"
  aws_region                    = var.aws_region
  cognito_user_pool_id          = module.auth_module.user_pool_id
  cognito_user_pool_client_id   = module.auth_module.user_pool_client_id
  sns_topic_arn                 = module.auth_module.sns_topic_arn
}