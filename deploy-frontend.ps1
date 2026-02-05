
# Frontend Deployment Script
# 1. Builds the React App
# 2. Creates S3 Bucket
# 3. Configures Static Website Hosting
# 4. Uploads Content

$BUCKET_NAME = "interon-email-agent-frontend-prod"
$REGION = "us-east-2"
$BUILD_DIR = "C:\Users\kamin\Downloads\Interon\Emails Agent\OneHR 2.0 for Email\dist"
$SOURCE_DIR = "C:\Users\kamin\Downloads\Interon\Emails Agent\OneHR 2.0 for Email"

Write-Host "🚀 Starting Frontend Deployment..." -ForegroundColor Cyan

# 1. Build React App
Write-Host "📦 Building React Application..."
Set-Location $SOURCE_DIR
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# 2. Create S3 Bucket
Write-Host "🪣 Creating S3 Bucket: $BUCKET_NAME"
aws s3 mb "s3://$BUCKET_NAME" --region $REGION

# 3. Enable Static Website Hosting
Write-Host "🌐 Enabling Static Website Hosting..."
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html

# 4. Disable Block Public Access (Required for Public Website)
Write-Host "🔓 Disabling Block Public Access..."
aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# 5. Set Bucket Policy (Public Read)
Write-Host "📜 Setting Bucket Policy..."
$policy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
"@
$policy | Out-File "bucket-policy.json" -Encoding ascii
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
Remove-Item "bucket-policy.json"

# 6. Upload Files
Write-Host "TG Uploading Files to S3..."
aws s3 sync $BUILD_DIR "s3://$BUCKET_NAME" --delete

# 7. Output URL
$websiteUrl = "http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌍 Website URL: $websiteUrl" -ForegroundColor Green
$websiteUrl | Out-File "deployment_url.txt" -Encoding ascii
Write-Host "Make sure to update your CORS configuration in API Gateway if needed." -ForegroundColor Yellow
