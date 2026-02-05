
$Region = "us-east-2"
$RoleName = "ContactManagerRole"
$FunctionName = "ManageContactsLambda"
$PolicyFile = "contact-manager-policy.json"
$TrustPolicyFile = "iam-trust-policy.json"

Write-Host "Deploying Contact Manager..." -ForegroundColor Cyan

# 1. Create IAM Role
Write-Host "Creating IAM Role..."
try {
    aws iam create-role --role-name $RoleName --assume-role-policy-document file://$TrustPolicyFile --no-cli-pager
}
catch {
    Write-Host "Role might already exist, continuing..." -ForegroundColor Yellow
}

# 2. Attach Policy
Write-Host "Attaching Policy..."
aws iam put-role-policy --role-name $RoleName --policy-name ContactManagerPolicy --policy-document file://$PolicyFile --no-cli-pager

# Wait for propagation
Start-Sleep -Seconds 10

# 3. Zip Function
Write-Host "Zipping function..."
$zipPath = "$PWD\lambda-functions\ManageContactsLambda\function.zip"
Compress-Archive -Path "$PWD\lambda-functions\ManageContactsLambda\lambda_function.py" -DestinationPath $zipPath -Force

# 4. Deploy Lambda
Write-Host "Deploying Lambda..."
$roleArn = aws iam get-role --role-name $RoleName --query 'Role.Arn' --output text --no-cli-pager

# Check if function exists
$exists = aws lambda get-function --function-name $FunctionName --region $Region --no-cli-pager 2>$null

if ($exists) {
    Write-Host "Updating existing function..."
    aws lambda update-function-code --function-name $FunctionName --zip-file fileb://$zipPath --region $Region --no-cli-pager
}
else {
    Write-Host "Creating new function..."
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.11 `
        --role $roleArn `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://$zipPath `
        --timeout 15 `
        --region $Region `
        --no-cli-pager
}

Write-Host "Deployment Complete!" -ForegroundColor Green
