# Deploy All Lambda Functions with Correct Role

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redeploying ALL Lambda Functions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$region = "us-east-2"
# Use the correct role ARN for this account
$role_arn = "arn:aws:iam::397753625517:role/lambda-dynamodb-role"

$functions = @(
    @{Name = "ListCampaignsLambda"; Path = "lambda-functions\ListCampaignsLambda" },
    @{Name = "CreateCampaignLambda"; Path = "lambda-functions\CreateCampaignLambda" },
    @{Name = "GetCampaignLambda"; Path = "lambda-functions\GetCampaignLambda" },
    @{Name = "ConfigureCampaignLambda"; Path = "lambda-functions\ConfigureCampaignLambda" },
    @{Name = "ManageRecipientsLambda"; Path = "lambda-functions\ManageRecipientsLambda" },
    @{Name = "ListContactsLambda"; Path = "lambda-functions\ListContactsLambda" },
    @{Name = "AddContactLambda"; Path = "lambda-functions\AddContactLambda" },
    @{Name = "DeleteContactLambda"; Path = "lambda-functions\DeleteContactLambda" }
)

$count = 0
foreach ($func in $functions) {
    $count++
    Write-Host "`n[$count/$($functions.Count)] Deploying $($func.Name)..." -ForegroundColor Yellow
    
    Set-Location $func.Path
    
    # Always update (create if doesn't exist)
    Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
    
    # Try to update first
    $updated = $false
    try {
        aws lambda update-function-code `
            --function-name $func.Name `
            --zip-file fileb://function.zip `
            --region $region 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Updated existing function" -ForegroundColor Green
            $updated = $true
        }
    }
    catch {}
    
    # If update failed, create new
    if (-not $updated) {
        Write-Host "  Creating new function..." -ForegroundColor Gray
        aws lambda create-function `
            --function-name $func.Name `
            --runtime python3.11 `
            --role $role_arn `
            --handler lambda_function.lambda_handler `
            --zip-file fileb://function.zip `
            --timeout 30 `
            --memory-size 256 `
            --region $region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Created new function" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ Failed to create" -ForegroundColor Red
        }
    }
    
    Remove-Item function.zip
    Set-Location ..\..
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
