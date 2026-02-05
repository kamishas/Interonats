# PowerShell script to deploy React Frontend to AWS S3
# Usage: .\deploy-to-s3.ps1 -BucketName "your-bucket-name"

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-2"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "OneHR Frontend Deployment to S3" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Set AWS region
$env:AWS_DEFAULT_REGION = $Region

# Build the React application
Write-Host "Building React application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully" -ForegroundColor Green
Write-Host ""

# Configure S3 bucket for static website hosting
Write-Host "Configuring S3 bucket for static website hosting..." -ForegroundColor Yellow
aws s3 website s3://$BucketName/ `
    --index-document index.html `
    --error-document index.html `
    --region $Region

# Set bucket policy for public read access
Write-Host "Setting bucket policy for public access..." -ForegroundColor Yellow
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BucketName/*"
        }
    ]
}
"@

$bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding utf8

aws s3api put-bucket-policy `
    --bucket $BucketName `
    --policy file://bucket-policy.json `
    --region $Region

Remove-Item "bucket-policy.json"

# Upload files to S3
Write-Host "Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync build/ s3://$BucketName/ `
    --region $Region `
    --delete `
    --cache-control "public,max-age=31536000,immutable" `
    --exclude "index.html" `
    --exclude "documents/*" `
    --exclude "organizations/*"

# Upload index.html with no-cache
aws s3 cp build/index.html s3://$BucketName/index.html `
    --region $Region `
    --cache-control "no-cache" `
    --content-type "text/html"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================="-ForegroundColor Green
    Write-Host "Deployment Successful!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    
    $websiteUrl = "http://$BucketName.s3-website.$Region.amazonaws.com"
    
    Write-Host "Website URL:" -ForegroundColor Cyan
    Write-Host "   $websiteUrl" -ForegroundColor White
    Write-Host ""
    
    # Save to file
    $websiteUrl | Out-File -FilePath ".website-url" -NoNewline
    Write-Host "URL saved to .website-url" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Note:" -ForegroundColor Cyan
    Write-Host "   For production, consider using CloudFront for HTTPS and better performance" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
