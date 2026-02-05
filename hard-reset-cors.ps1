# Hard Reset CORS for API Gateway
$apiId = "5cs5faz106"
$resourceId = "84f7zl" # Resource ID for /images
$region = "us-east-2"

Write-Host "Resetting CORS for API $apiId..." -ForegroundColor Cyan

# 1. Delete existing OPTIONS method entirely
aws apigateway delete-method --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --region $region 2>$null

# 2. Create OPTIONS method (Mock Integration)
aws apigateway put-method --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --authorization-type NONE --region $region
aws apigateway put-integration --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --type MOCK --request-templates '{\"application/json\":\"{\\\"statusCode\\\":200}\"}' --region $region

# 3. Define Method Response (headers that are allowed)
aws apigateway put-method-response --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\":true,\"method.response.header.Access-Control-Allow-Methods\":true,\"method.response.header.Access-Control-Allow-Origin\":true}' --region $region

# 4. Define Integration Response (values for those headers - ALL WILDCARDS)
# Note: PowerShell escaping for JSON inside CLI args is tricky. Using explicit single quotes for values.
aws apigateway put-integration-response --rest-api-id $apiId --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\":\"'*'\",\"method.response.header.Access-Control-Allow-Methods\":\"'OPTIONS, POST'\",\"method.response.header.Access-Control-Allow-Origin\":\"'*'\"}' --region $region

# 5. Deploy to Prod
aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --region $region

Write-Host "CORS Reset Complete. Waiting for propagation..." -ForegroundColor Green
Start-Sleep -Seconds 5
