
# Enable CORS on Gateway Responses (4xx/5xx)
# This ensures CORS headers are present even when API Gateway fails or Lambda crashes
Write-Host "Configuring Gateway Responses for CORS..." -ForegroundColor Cyan

$apiId = "5cs5faz106"
$region = "us-east-2"

# 4XX (DEFAULT_4XX)
aws apigateway put-gateway-response `
    --rest-api-id $apiId `
    --response-type DEFAULT_4XX `
    --response-parameters '{"gatewayresponse.header.Access-Control-Allow-Origin":"'"'"'*'"'"'","gatewayresponse.header.Access-Control-Allow-Headers":"'"'"'*'"'"'","gatewayresponse.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'"}' `
    --region $region

# 5XX (DEFAULT_5XX)
aws apigateway put-gateway-response `
    --rest-api-id $apiId `
    --response-type DEFAULT_5XX `
    --response-parameters '{"gatewayresponse.header.Access-Control-Allow-Origin":"'"'"'*'"'"'","gatewayresponse.header.Access-Control-Allow-Headers":"'"'"'*'"'"'","gatewayresponse.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'"}' `
    --region $region

# Redeploy to apply changes
Write-Host "Redeploying API..." -ForegroundColor Green
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --region $region

Write-Host "Gateway Responses Configured!" -ForegroundColor Green
