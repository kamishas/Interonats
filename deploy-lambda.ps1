# Deploy Image Compliance Lambda
Write-Host "Deploying ImageComplianceLambda..." -ForegroundColor Cyan

# Check if function exists
$functionExists = $false
try {
    aws lambda get-function --function-name ImageComplianceLambda --region us-east-2 2>$null
    $functionExists = $true
    Write-Host "Function exists, updating code..." -ForegroundColor Yellow
}
catch {
    Write-Host "Creating new function..." -ForegroundColor Green
}

if ($functionExists) {
    # Update existing function
    aws lambda update-function-code `
        --function-name ImageComplianceLambda `
        --zip-file fileb://lambda-functions/ImageComplianceLambda/image-compliance.zip `
        --region us-east-2
}
else {
    # Create new function
    aws lambda create-function `
        --function-name ImageComplianceLambda `
        --runtime python3.11 `
        --role arn:aws:iam::397753625517:role/ImageComplianceLambdaRole `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://lambda-functions/ImageComplianceLambda/image-compliance.zip `
        --timeout 30 `
        --memory-size 1024 `
        --region us-east-2
}

Write-Host "Lambda deployed successfully!" -ForegroundColor Green
