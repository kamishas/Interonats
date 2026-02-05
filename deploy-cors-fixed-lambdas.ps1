# Deploy All Lambda Functions with Dynamic CORS

Write-Host "="*80 -ForegroundColor Cyan
Write-Host "Deploying Lambda Functions with Dynamic CORS" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan

$region = "us-east-2"

# Get role from existing function
$role = aws lambda get-function --function-name SendCampaignLambda --query "Configuration.Role" --output text --region $region

if (-not $role) {
    Write-Host "❌ Failed to get IAM role" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Using IAM role: $role" -ForegroundColor Green

$functions = @(
    "ListContactsLambda",
    "ListCampaignsLambda"
)

foreach ($func in $functions) {
    Write-Host "`nDeploying $func..." -ForegroundColor Yellow
    
    $path = "lambda-functions\$func"
    Set-Location $path
    
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    
    # Try update first
    $updated = $false
    try {
        aws lambda update-function-code --function-name $func --zip-file fileb://function.zip --region $region 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Updated" -ForegroundColor Green
            $updated = $true
        }
    }
    catch {}
    
    # Create if update failed
    if (-not $updated) {
        aws lambda create-function `
            --function-name $func `
            --runtime python3.11 `
            --role $role `
            --handler lambda_function.lambda_handler `
            --zip-file fileb://function.zip `
            --timeout 30 `
            --memory-size 256 `
            --region $region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Created" -ForegroundColor Green
        }
    }
    
    Remove-Item function.zip
    Set-Location ..\..
}

Write-Host "`n" + "="*80 -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "="*80 -ForegroundColor Green
