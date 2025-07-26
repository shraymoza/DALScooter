# Set credentials
. .\aws-config.ps1

Write-Host "🚀 Starting DALScooter Deployment..." -ForegroundColor Green

# Run terraform apply
Write-Host "🏗️  Deploying infrastructure with Terraform..." -ForegroundColor Yellow
terraform init
terraform plan
terraform apply -auto-approve

Write-Output "Deployment completed."

Write-Host "Triggering Amplify build job for main branch..."

$AMPLIFY_APP_ID = (terraform output -raw amplify_app_id)
$BRANCH_NAME = "main"

aws amplify start-job `
  --app-id $AMPLIFY_APP_ID `
  --branch-name $BRANCH_NAME `
  --job-type RELEASE `
  --job-reason "Initial deploy from script" | Out-Null

Write-Host "Amplify deployment job started."

# Display deployment outputs
Write-Host "📋 Deployment Outputs:" -ForegroundColor Yellow
terraform output

Write-Host "🎉 DALScooter deployment completed successfully!" -ForegroundColor Green
Write-Host "Remember to update your frontend environment variables with the new API endpoints." -ForegroundColor Yellow