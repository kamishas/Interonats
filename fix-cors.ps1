# Fix API Gateway CORS for Image Upload
Write-Host "Fixing CORS configuration for /images endpoint..." -ForegroundColor Cyan

$apiId = "5cs5faz106"
$region = "us-east-2"

# Get resources
$resources = aws apigateway get-resources --rest-api-id $apiId --region $region | ConvertFrom-Json
$imagesResource = $resources.items | Where-Object { $_.path -eq "/images" }
$resourceId = $imagesResource.id

Write-Host "Images Resource ID: $resourceId" -ForegroundColor Yellow

# Update OPTIONS method response to allow all methods and origins
Write-Host "Updating OPTIONS method..." -ForegroundColor Green

# Delete existing OPTIONS integration response
aws apigateway delete-integration-response `
    --rest-api-id $apiId `
    --resource-id $resourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --region $region 2>$null

# Delete existing OPTIONS method response
aws apigateway delete-method-response `
    --rest-api-id $apiId `
    --resource-id $resourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --region $region 2>$null

# Recreate OPTIONS method response with all headers
aws apigateway put-method-response `
    --rest-api-id $apiId `
    --resource-id $resourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters @{
    "method.response.header.Access-Control-Allow-Headers" = $true
    "method.response.header.Access-Control-Allow-Methods" = $true
    "method.response.header.Access-Control-Allow-Origin"  = $true
} `
    --region $region

# Recreate OPTIONS integration response with wildcard values
aws apigateway put-integration-response `
    --rest-api-id $apiId `
    --resource-id $resourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters @{
    "method.response.header.Access-Control-Allow-Headers" = "'*'"
    "method.response.header.Access-Control-Allow-Methods" = "'*'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
} `
    --region $region

# Update POST method response to include CORS headers
Write-Host "Updating POST method response..." -ForegroundColor Green

aws apigateway put-method-response `
    --rest-api-id $apiId `
    --resource-id $resourceId `
    --http-method POST `
    --status-code 200 `
    --response-parameters @{
    "method.response.header.Access-Control-Allow-Origin" = $true
} `
    --region $region 2>$null

# Deploy changes
Write-Host "Deploying changes to prod stage..." -ForegroundColor Green
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --description "Fix CORS - allow all methods and origins" `
    --region $region

Write-Host "`nCORS configuration updated successfully!" -ForegroundColor Green
Write-Host "API Endpoint: https://$apiId.execute-api.$region.amazonaws.com/prod/images" -ForegroundColor Cyan
Write-Host "`nCORS Headers:" -ForegroundColor Yellow
Write-Host "  Access-Control-Allow-Origin: *" -ForegroundColor White
Write-Host "  Access-Control-Allow-Methods: *" -ForegroundColor White
Write-Host "  Access-Control-Allow-Headers: *" -ForegroundColor White
