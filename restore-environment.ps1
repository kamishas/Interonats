# Restore Environment
Write-Host "Restoring Environment..." -ForegroundColor Cyan

# 1. Zip ImageComplianceLambda
Write-Host "Zipping ImageComplianceLambda..." -ForegroundColor Yellow
$source = "lambda-functions\ImageComplianceLambda\lambda_function.py"
$zip = "lambda-functions\ImageComplianceLambda\image-compliance.zip"
if (Test-Path $zip) { Remove-Item $zip }
Compress-Archive -Path $source -DestinationPath $zip

# 2. Deploy ImageComplianceLambda
Write-Host "Deploying ImageComplianceLambda..." -ForegroundColor Yellow
aws lambda create-function `
    --function-name ImageComplianceLambda `
    --runtime python3.11 `
    --role arn:aws:iam::397753625517:role/ImageComplianceLambdaRole `
    --handler lambda_function.lambda_handler `
    --zip-file fileb://$zip `
    --timeout 60 `
    --memory-size 512 `
    --region us-east-2 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ImageComplianceLambda likely exists or error..." -ForegroundColor Yellow
    # Try update just in case
    aws lambda update-function-code `
        --function-name ImageComplianceLambda `
        --zip-file fileb://$zip `
        --region us-east-2
}

# 3. Fix API Gateway (Image POST integration) & Deploy
Write-Host "Fixing API Gateway..." -ForegroundColor Yellow
python fix-api-gateway.py

Write-Host "Environment Restored!" -ForegroundColor Green
