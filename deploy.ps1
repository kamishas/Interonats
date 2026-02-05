# Interon AI Email Agent - Deployment Helper Script
# This script provides common deployment and management tasks

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('pull', 'deploy-frontend', 'deploy-lambda', 'list-resources', 'test-lambda', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Mandatory = $false)]
    [string]$LambdaFunction = '',
    
    [Parameter(Mandatory = $false)]
    [string]$Region = 'us-east-2'
)

$S3_BUCKET = "interon-email-agent-frontend-kamin"
$LAMBDA_FUNCTIONS = @(
    "GenerateEmailLambda",
    "SendCampaignLambda",
    "ListCampaignsLambda",
    "ConfigureCampaignLambda"
)

function Show-Help {
    Write-Host @"
Interon AI Email Agent - Deployment Helper
==========================================

Usage: .\deploy.ps1 -Command <command> [options]

Commands:
  pull                Pull all code from AWS (frontend + Lambda functions)
  deploy-frontend     Deploy frontend to S3
  deploy-lambda       Deploy a specific Lambda function
  list-resources      List all AWS resources (Lambda, DynamoDB, S3)
  test-lambda         Test a Lambda function locally
  help                Show this help message

Options:
  -LambdaFunction     Name of Lambda function (required for deploy-lambda, test-lambda)
  -Region             AWS region (default: us-east-2)

Examples:
  .\deploy.ps1 -Command pull
  .\deploy.ps1 -Command deploy-frontend
  .\deploy.ps1 -Command deploy-lambda -LambdaFunction SendCampaignLambda
  .\deploy.ps1 -Command list-resources
  .\deploy.ps1 -Command test-lambda -LambdaFunction GenerateEmailLambda

"@
}

function Pull-Code {
    Write-Host "📥 Pulling code from AWS..." -ForegroundColor Cyan
    
    # Pull frontend
    Write-Host "`n📦 Downloading frontend from S3..." -ForegroundColor Yellow
    aws s3 sync "s3://$S3_BUCKET/" ./frontend --region $Region
    
    # Pull Lambda functions
    Write-Host "`n⚡ Downloading Lambda functions..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "./lambda-functions" | Out-Null
    
    foreach ($fn in $LAMBDA_FUNCTIONS) {
        Write-Host "  → $fn" -ForegroundColor Gray
        $url = aws lambda get-function --function-name $fn --region $Region --query 'Code.Location' --output text
        Invoke-WebRequest -Uri $url -OutFile "./lambda-functions/$fn.zip"
        Expand-Archive -Path "./lambda-functions/$fn.zip" -DestinationPath "./lambda-functions/$fn" -Force
    }
    
    Write-Host "`n✅ Code pulled successfully!" -ForegroundColor Green
}

function Deploy-Frontend {
    Write-Host "🚀 Deploying frontend to S3..." -ForegroundColor Cyan
    
    if (-not (Test-Path "./frontend")) {
        Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
        return
    }
    
    # Upload to S3
    aws s3 sync ./frontend/ "s3://$S3_BUCKET/" --delete --region $Region
    
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
    Write-Host "🌐 URL: https://$S3_BUCKET.s3.$Region.amazonaws.com/index.html" -ForegroundColor Cyan
}

function Deploy-Lambda {
    param([string]$FunctionName)
    
    if (-not $FunctionName) {
        Write-Host "❌ Please specify a Lambda function name with -LambdaFunction" -ForegroundColor Red
        Write-Host "Available functions: $($LAMBDA_FUNCTIONS -join ', ')" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🚀 Deploying Lambda function: $FunctionName" -ForegroundColor Cyan
    
    $functionPath = "./lambda-functions/$FunctionName"
    if (-not (Test-Path $functionPath)) {
        Write-Host "❌ Function directory not found: $functionPath" -ForegroundColor Red
        return
    }
    
    # Create deployment package
    $zipPath = "./lambda-functions/$FunctionName-deploy.zip"
    Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
    
    Push-Location $functionPath
    Compress-Archive -Path * -DestinationPath $zipPath -Force
    Pop-Location
    
    # Upload to Lambda
    Write-Host "⬆️  Uploading to AWS Lambda..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$zipPath" `
        --region $Region
    
    # Clean up
    Remove-Item $zipPath
    
    Write-Host "✅ Lambda function deployed successfully!" -ForegroundColor Green
}

function List-Resources {
    Write-Host "📋 Listing AWS Resources..." -ForegroundColor Cyan
    
    # Lambda Functions
    Write-Host "`n⚡ Lambda Functions:" -ForegroundColor Yellow
    aws lambda list-functions --region $Region --output json | `
        ConvertFrom-Json | `
        Select-Object -ExpandProperty Functions | `
        Where-Object { $_.FunctionName -in $LAMBDA_FUNCTIONS } | `
        Format-Table FunctionName, Runtime, LastModified -AutoSize
    
    # DynamoDB Tables
    Write-Host "`n💾 DynamoDB Tables:" -ForegroundColor Yellow
    aws dynamodb list-tables --region $Region --output json | `
        ConvertFrom-Json | `
        Select-Object -ExpandProperty TableNames | `
        Where-Object { $_ -like '*Campaign*' } | `
        ForEach-Object { Write-Host "  → $_" -ForegroundColor Gray }
    
    # S3 Bucket
    Write-Host "`n📦 S3 Bucket:" -ForegroundColor Yellow
    Write-Host "  → $S3_BUCKET" -ForegroundColor Gray
    Write-Host "  → https://$S3_BUCKET.s3.$Region.amazonaws.com/index.html" -ForegroundColor Cyan
}

function Test-Lambda {
    param([string]$FunctionName)
    
    if (-not $FunctionName) {
        Write-Host "❌ Please specify a Lambda function name with -LambdaFunction" -ForegroundColor Red
        return
    }
    
    Write-Host "🧪 Testing Lambda function: $FunctionName" -ForegroundColor Cyan
    
    $functionPath = "./lambda-functions/$FunctionName"
    if (-not (Test-Path $functionPath)) {
        Write-Host "❌ Function directory not found: $functionPath" -ForegroundColor Red
        return
    }
    
    # Create test event
    $testEvent = @{
        body = @{
            intent = "Test email generation"
            tone   = "Professional"
            count  = 2
        } | ConvertTo-Json
    } | ConvertTo-Json
    
    $testEventFile = "./test-event.json"
    $testEvent | Out-File -FilePath $testEventFile -Encoding utf8
    
    # Invoke Lambda
    Write-Host "📤 Invoking Lambda function..." -ForegroundColor Yellow
    aws lambda invoke `
        --function-name $FunctionName `
        --payload "file://$testEventFile" `
        --region $Region `
        response.json
    
    # Show response
    Write-Host "Response:" -ForegroundColor Yellow
    Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
    # Clean up
    Remove-Item $testEventFile, response.json -ErrorAction SilentlyContinue
}

# Main execution
switch ($Command) {
    'pull' { Pull-Code }
    'deploy-frontend' { Deploy-Frontend }
    'deploy-lambda' { Deploy-Lambda -FunctionName $LambdaFunction }
    'list-resources' { List-Resources }
    'test-lambda' { Test-Lambda -FunctionName $LambdaFunction }
    'help' { Show-Help }
    default { Show-Help }
}
