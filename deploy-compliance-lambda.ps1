# Deploy Compliance Checker Lambda (Fixed)
Write-Host "Deploying ComplianceCheckerLambda..." -ForegroundColor Cyan

# 1. Create Zip File
$sourceFile = "lambda-functions\ComplianceCheckerLambda\lambda_function.py"
$zipFile = "lambda-functions\ComplianceCheckerLambda\compliance-checker.zip"

Write-Host "Creating zip package..." -ForegroundColor Yellow
if (Test-Path $zipFile) { Remove-Item $zipFile }
Compress-Archive -Path $sourceFile -DestinationPath $zipFile

# 2. Try to create function first
Write-Host "Attempting to create function..." -ForegroundColor Yellow
aws lambda create-function `
    --function-name ComplianceCheckerLambda `
    --runtime python3.11 `
    --role arn:aws:iam::397753625517:role/ImageComplianceLambdaRole `
    --handler lambda_function.lambda_handler `
    --zip-file fileb://$zipFile `
    --timeout 60 `
    --memory-size 512 `
    --region us-east-2 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Function likely exists, updating code..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name ComplianceCheckerLambda `
        --zip-file fileb://$zipFile `
        --region us-east-2
}

Write-Host "Lambda deployment process finished." -ForegroundColor Green
