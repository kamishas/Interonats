# Configure API Gateway for Compliance
Write-Host "Configuring API Gateway for Compliance..." -ForegroundColor Cyan

# 1. Get API ID
$apiInfo = aws apigateway get-rest-apis --region us-east-2 --query "items[0]" | ConvertFrom-Json
$apiId = $apiInfo.id
Write-Host "API ID: $apiId" -ForegroundColor Yellow

# 2. Get Root Resource ID
$resources = aws apigateway get-resources --rest-api-id $apiId --region us-east-2 | ConvertFrom-Json
$rootId = ($resources.items | Where-Object { $_.path -eq "/" }).id

# 3. Create /compliance resource
Write-Host "Creating /compliance resource..." -ForegroundColor Green
$complianceResource = $resources.items | Where-Object { $_.path -eq "/compliance" }

if (-not $complianceResource) {
    try {
        $complianceResource = aws apigateway create-resource --rest-api-id $apiId --parent-id $rootId --path-part compliance --region us-east-2 | ConvertFrom-Json
    }
    catch {
        Write-Host "Error creating compliance resource, it might exist but not found in list?" -ForegroundColor Red
    }
}
else {
    Write-Host "/compliance resource already exists" -ForegroundColor Yellow
}
$complianceId = $complianceResource.id

# 4. Create /compliance/check resource
Write-Host "Creating /compliance/check resource..." -ForegroundColor Green
# Refresh resources list to be sure
$resources = aws apigateway get-resources --rest-api-id $apiId --region us-east-2 | ConvertFrom-Json
$checkResource = $resources.items | Where-Object { $_.path -eq "/compliance/check" }

if (-not $checkResource) {
    $checkResource = aws apigateway create-resource --rest-api-id $apiId --parent-id $complianceId --path-part check --region us-east-2 | ConvertFrom-Json
}
else {
    Write-Host "/compliance/check resource already exists" -ForegroundColor Yellow
}
$checkId = $checkResource.id

# 5. Configure POST Method
Write-Host "Configuring POST method..." -ForegroundColor Green
aws apigateway put-method --rest-api-id $apiId --resource-id $checkId --http-method POST --authorization-type NONE --region us-east-2

# 6. Lambda Integration
$lambdaArn = aws lambda get-function --function-name ComplianceCheckerLambda --region us-east-2 --query "Configuration.FunctionArn" --output text
$uri = "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/$lambdaArn/invocations"

aws apigateway put-integration --rest-api-id $apiId --resource-id $checkId --http-method POST --type AWS_PROXY --integration-http-method POST --uri $uri --region us-east-2

# 7. Add Lambda Permission
$sourceArn = "arn:aws:execute-api:us-east-2:397753625517:$apiId/*/POST/compliance/check"
aws lambda add-permission --function-name ComplianceCheckerLambda --statement-id apigateway-compliance-check --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn --region us-east-2 2>$null

# 8. Configure CORS (OPTIONS)
Write-Host "Configuring CORS..." -ForegroundColor Green
aws apigateway put-method --rest-api-id $apiId --resource-id $checkId --http-method OPTIONS --authorization-type NONE --region us-east-2

aws apigateway put-integration --rest-api-id $apiId --resource-id $checkId --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\":200}"}' --region us-east-2

aws apigateway put-method-response --rest-api-id $apiId --resource-id $checkId --http-method OPTIONS --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true" --region us-east-2

aws apigateway put-integration-response --rest-api-id $apiId --resource-id $checkId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' --region us-east-2

# 9. Deploy API
Write-Host "Deploying API..." -ForegroundColor Green
aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --region us-east-2

$apiUrl = "https://$apiId.execute-api.us-east-2.amazonaws.com/prod/compliance/check"
Write-Host "API Configured!" -ForegroundColor Green
Write-Host "Endpoint: $apiUrl" -ForegroundColor Cyan
