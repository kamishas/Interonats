# Complete CORS Fix for API Gateway
Write-Host "=== Fixing API Gateway CORS ===" -ForegroundColor Cyan

$apiId = "5cs5faz106"
$resourceId = "84f7zl"
$region = "us-east-2"

# Step 1: Delete existing OPTIONS responses
Write-Host "Cleaning up existing OPTIONS configuration..." -ForegroundColor Yellow
aws apigateway delete-integration-response --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --status-code 200 --region $region 2>$null
aws apigateway delete-method-response --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --status-code 200 --region $region 2>$null
aws apigateway delete-method --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --region $region 2>$null

# Step 2: Create OPTIONS method
Write-Host "Creating OPTIONS method..." -ForegroundColor Green
aws apigateway put-method --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --authorization-type NONE --region $region

# Step 3: Create MOCK integration
Write-Host "Creating MOCK integration..." -ForegroundColor Green
aws apigateway put-integration --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --type MOCK --request-templates '{\"application/json\":\"{\\\"statusCode\\\":200}\"}' --region $region

# Step 4: Create method response
Write-Host "Creating method response with CORS headers..." -ForegroundColor Green
aws apigateway put-method-response --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\":true,\"method.response.header.Access-Control-Allow-Methods\":true,\"method.response.header.Access-Control-Allow-Origin\":true}' --region $region

# Step 5: Create integration response with wildcard
Write-Host "Creating integration response with wildcard CORS..." -ForegroundColor Green
aws apigateway put-integration-response --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\":\"'"'"'*'"'"'\",\"method.response.header.Access-Control-Allow-Methods\":\"'"'"'*'"'"'\",\"method.response.header.Access-Control-Allow-Origin\":\"'"'"'*'"'"'\"}' --region $region

# Step 6: Deploy
Write-Host "Deploying to prod..." -ForegroundColor Green
aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --description "CORS wildcard fix" --region $region

Write-Host "`n=== CORS Fixed ===" -ForegroundColor Green
Write-Host "Endpoint: https://$apiId.execute-api.$region.amazonaws.com/prod/images" -ForegroundColor Cyan
Write-Host "All origins, methods, and headers allowed" -ForegroundColor White
