# Deploy Lambda Functions and Configure API Gateway

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Backend Lambda Functions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$region = "us-east-2"
$role_arn = "arn:aws:iam::397753625517:role/EmailAutomationLambdaRole"

# Function 1: ManageRecipientsLambda
Write-Host "`n1. Deploying ManageRecipientsLambda..." -ForegroundColor Yellow

Set-Location "lambda-functions\ManageRecipientsLambda"

# Check if function exists
$functionExists = aws lambda get-function --function-name ManageRecipientsLambda --region $region 2>$null

if ($functionExists) {
    Write-Host "  Updating existing function..." -ForegroundColor Gray
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    aws lambda update-function-code `
        --function-name ManageRecipientsLambda `
        --zip-file fileb://function.zip `
        --region $region
    Remove-Item function.zip
}
else {
    Write-Host "  Creating new function..." -ForegroundColor Gray
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    aws lambda create-function `
        --function-name ManageRecipientsLambda `
        --runtime python3.11 `
        --role $role_arn `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://function.zip `
        --timeout 30 `
        --memory-size 256 `
        --region $region
    Remove-Item function.zip
}

Set-Location ..\..

# Function 2: ConfigureCampaignLambda
Write-Host "`n2. Deploying ConfigureCampaignLambda..." -ForegroundColor Yellow

Set-Location "lambda-functions\ConfigureCampaignLambda"

$functionExists = aws lambda get-function --function-name ConfigureCampaignLambda --region $region 2>$null

if ($functionExists) {
    Write-Host "  Updating existing function..." -ForegroundColor Gray
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    aws lambda update-function-code `
        --function-name ConfigureCampaignLambda `
        --zip-file fileb://function.zip `
        --region $region
    Remove-Item function.zip
}
else {
    Write-Host "  Creating new function..." -ForegroundColor Gray
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    aws lambda create-function `
        --function-name ConfigureCampaignLambda `
        --runtime python3.11 `
        --role $role_arn `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://function.zip `
        --timeout 30 `
        --memory-size 256 `
        --region $region
    Remove-Item function.zip
}

Set-Location ..\..

# Function 3: GetCampaignLambda
Write-Host "`n3. Deploying GetCampaignLambda..." -ForegroundColor Yellow

Set-Location "lambda-functions\GetCampaignLambda"

$functionExists = aws lambda get-function --function-name GetCampaignLambda --region $region 2>$null

if ($functionExists) {
    Write-Host "  Updating existing function..." -ForegroundColor Gray
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    aws lambda update-function-code `
        --function-name GetCampaignLambda `
        --zip-file fileb://function.zip `
        --region $region
    Remove-Item function.zip
}
else {
    Write-Host "  Creating new function..." -ForegroundColor Gray
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    aws lambda create-function `
        --function-name GetCampaignLambda `
        --runtime python3.11 `
        --role $role_arn `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://function.zip `
        --timeout 30 `
        --memory-size 256 `
        --region $region
    Remove-Item function.zip
}

Set-Location ..\..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Lambda Functions Deployed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run configure-api-gateway.py to create API routes" -ForegroundColor White
Write-Host "2. Update frontend api.js with new endpoints" -ForegroundColor White
Write-Host "3. Test the complete flow" -ForegroundColor White
