# Deploy Fix
Write-Host "Re-deploying ImageComplianceLambda..." -ForegroundColor Cyan

# 1. Zip
$source = "lambda-functions\ImageComplianceLambda\lambda_function.py"
$zip = "lambda-functions\ImageComplianceLambda\image-compliance.zip"
if (Test-Path $zip) { Remove-Item $zip }
Compress-Archive -Path $source -DestinationPath $zip

# 2. Update Function Code
aws lambda update-function-code `
    --function-name ImageComplianceLambda `
    --zip-file fileb://$zip `
    --region us-east-2

Write-Host "Deployed!" -ForegroundColor Green
