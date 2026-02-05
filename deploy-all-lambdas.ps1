# Deploy All Production Lambda Functions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying ALL Production Lambda Functions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$region = "us-east-2"
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
    
    # Check if function exists
    $functionExists = aws lambda get-function --function-name $func.Name --region $region 2>$null
    
    if ($functionExists) {
        Write-Host "  Updating existing function..." -ForegroundColor Gray
        Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
        aws lambda update-function-code `
            --function-name $func.Name `
            --zip-file fileb://function.zip `
            --region $region | Out-Null
        Remove-Item function.zip
        Write-Host "  ✅ Updated" -ForegroundColor Green
    }
    else {
        Write-Host "  Creating new function..." -ForegroundColor Gray
        Compress-Archive -Path lambda_function.py -DestinationPath function.zip -Force
        aws lambda create-function `
            --function-name $func.Name `
            --runtime python3.11 `
            --role $role_arn `
            --handler lambda_function.lambda_handler `
            --zip-file fileb://function.zip `
            --timeout 30 `
            --memory-size 256 `
            --region $region | Out-Null
        Remove-Item function.zip
        Write-Host "  ✅ Created" -ForegroundColor Green
    }
    
    Set-Location ..\..
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "All Lambda Functions Deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nDeployed $($functions.Count) functions:" -ForegroundColor Cyan
foreach ($func in $functions) {
    Write-Host "  ✅ $($func.Name)" -ForegroundColor White
}
