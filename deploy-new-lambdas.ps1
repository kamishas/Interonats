# Deploy All Lambda Functions with Correct Role from Existing Function

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redeploying Lambda Functions (Fixed)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$region = "us-east-2"

# Get role from existing working Lambda
Write-Host "`nGetting IAM role from SendCampaignLambda..." -ForegroundColor Gray
$role_arn = aws lambda get-function --function-name SendCampaignLambda --query "Configuration.Role" --output text --region $region

if ($LASTEXITCODE -eq 0 -and $role_arn) {
    Write-Host "✅ Using role: $role_arn" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to get role, using default" -ForegroundColor Red
    $role_arn = "arn:aws:iam::397753625517:role/lambda-dynamodb-role"
}

$functions = @(
    @{Name = "ListCampaignsLambda"; Path = "lambda-functions\ListCampaignsLambda" },
    @{Name = "CreateCampaignLambda"; Path = "lambda-functions\CreateCampaignLambda" },
    @{Name = "ListContactsLambda"; Path = "lambda-functions\ListContactsLambda" },
    @{Name = "AddContactLambda"; Path = "lambda-functions\AddContactLambda" },
    @{Name = "DeleteContactLambda"; Path = "lambda-functions\DeleteContactLambda" }
)

$count = 0
foreach ($func in $functions) {
    $count++
    Write-Host "`n[$count/$($functions.Count)] Deploying $($func.Name)..." -ForegroundColor Yellow
    
    Set-Location $func.Path
    
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    
    # Try update first
    $result = aws lambda update-function-code --function-name $func.Name --zip-file fileb://function.zip --region $region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Updated" -ForegroundColor Green
    }
    else {
        # Create new
        Write-Host "  Creating new..." -ForegroundColor Gray
        $result = aws lambda create-function `
            --function-name $func.Name `
            --runtime python3.11 `
            --role $role_arn `
            --handler lambda_function.lambda_handler `
            --zip-file fileb://function.zip `
            --timeout 30 `
            --memory-size 256 `
            --region $region 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Created" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ Error: $result" -ForegroundColor Red
        }
    }
    
    Remove-Item function.zip
    Set-Location ..\..
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
