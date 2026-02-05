# Configure API Gateway for Image Compliance
Write-Host "Configuring API Gateway..." -ForegroundColor Cyan

# Get API Gateway details
$apiInfo = aws apigateway get-rest-apis --region us-east-2 --query "items[0]" | ConvertFrom-Json
$apiId = $apiInfo.id
$apiName = $apiInfo.name

Write-Host "API ID: $apiId" -ForegroundColor Yellow
Write-Host "API Name: $apiName" -ForegroundColor Yellow

# Get root resource ID
$resources = aws apigateway get-resources --rest-api-id $apiId --region us-east-2 | ConvertFrom-Json
$rootId = ($resources.items | Where-Object { $_.path -eq "/" }).id

Write-Host "Root Resource ID: $rootId" -ForegroundColor Yellow

# Create /images resource
Write-Host "Creating /images resource..." -ForegroundColor Green
$imagesResource = aws apigateway create-resource `
    --rest-api-id $apiId `
    --parent-id $rootId `
    --path-part images `
    --region us-east-2 2>&1 | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Resource might already exist, getting it..." -ForegroundColor Yellow
    $imagesResource = ($resources.items | Where-Object { $_.path -eq "/images" })
}

$imagesResourceId = $imagesResource.id
Write-Host "Images Resource ID: $imagesResourceId" -ForegroundColor Yellow

# Create POST method
Write-Host "Creating POST method..." -ForegroundColor Green
aws apigateway put-method `
    --rest-api-id $apiId `
    --resource-id $imagesResourceId `
    --http-method POST `
    --authorization-type NONE `
    --region us-east-2

# Get Lambda ARN
$lambdaArn = aws lambda get-function --function-name ImageComplianceLambda --region us-east-2 --query "Configuration.FunctionArn" --output text

# Create Lambda integration
Write-Host "Integrating with Lambda..." -ForegroundColor Green
$uri = "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/$lambdaArn/invocations"

aws apigateway put-integration `
    --rest-api-id $apiId `
    --resource-id $imagesResourceId `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri $uri `
    --region us-east-2

# Add Lambda permission
Write-Host "Adding Lambda permission..." -ForegroundColor Green
$sourceArn = "arn:aws:execute-api:us-east-2:397753625517:$apiId/*/POST/images"

aws lambda add-permission `
    --function-name ImageComplianceLambda `
    --statement-id apigateway-image-compliance `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn $sourceArn `
    --region us-east-2 2>$null

# Enable CORS
Write-Host "Enabling CORS..." -ForegroundColor Green
aws apigateway put-method `
    --rest-api-id $apiId `
    --resource-id $imagesResourceId `
    --http-method OPTIONS `
    --authorization-type NONE `
    --region us-east-2

aws apigateway put-integration `
    --rest-api-id $apiId `
    --resource-id $imagesResourceId `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates '{"application/json":"{\"statusCode\":200}"}' `
    --region us-east-2

aws apigateway put-method-response `
    --rest-api-id $apiId `
    --resource-id $imagesResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters "method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true" `
    --region us-east-2

aws apigateway put-integration-response `
    --rest-api-id $apiId `
    --resource-id $imagesResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' `
    --region us-east-2

# Deploy API
Write-Host "Deploying API to prod stage..." -ForegroundColor Green
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --region us-east-2

$apiUrl = "https://$apiId.execute-api.us-east-2.amazonaws.com/prod"
Write-Host "`nAPI Gateway configured successfully!" -ForegroundColor Green
Write-Host "API URL: $apiUrl" -ForegroundColor Cyan
Write-Host "Image endpoint: $apiUrl/images" -ForegroundColor Cyan
