# Fix CORS for Compliance Check
Write-Host "Fixing CORS for Compliance Check..." -ForegroundColor Cyan

$apiId = "5cs5faz106"
$checkId = "3t3tev" # From get-resources

# 1. Put Integration for OPTIONS
Write-Host "Putting Integration for OPTIONS..." -ForegroundColor Green
aws apigateway put-integration `
    --rest-api-id $apiId `
    --resource-id $checkId `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates '{"application/json":"{\"statusCode\":200}"}' `
    --region us-east-2

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to put integration" -ForegroundColor Red
    exit
}

# 2. Put Method Response
Write-Host "Putting Method Response for OPTIONS..." -ForegroundColor Green
aws apigateway put-method-response `
    --rest-api-id $apiId `
    --resource-id $checkId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters "method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true" `
    --region us-east-2

# 3. Put Integration Response
Write-Host "Putting Integration Response for OPTIONS..." -ForegroundColor Green
aws apigateway put-integration-response `
    --rest-api-id $apiId `
    --resource-id $checkId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' `
    --region us-east-2

# 4. Deploy API
Write-Host "Deploying API..." -ForegroundColor Green
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --region us-east-2

Write-Host "CORS Fixed and API Deployed!" -ForegroundColor Green
