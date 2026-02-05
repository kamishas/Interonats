# 🚀 Deployment Guide: Compliance Features

## Quick Deploy

### 1. Create S3 Bucket for Images

```powershell
# Create bucket
aws s3 mb s3://interon-email-images --region us-east-2

# Enable public read access
aws s3api put-bucket-policy --bucket interon-email-images --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::interon-email-images/*"
  }]
}'
```

### 2. Deploy Compliance Checker Lambda

```powershell
# Package and deploy
cd lambda-functions/ComplianceCheckerLambda
Compress-Archive -Path * -DestinationPath compliance-checker.zip -Force

aws lambda create-function \
  --function-name ComplianceCheckerLambda \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://compliance-checker.zip \
  --timeout 30 \
  --memory-size 512 \
  --region us-east-2
```

### 3. Deploy Image Upload Lambda

```powershell
# Package and deploy
cd lambda-functions/ImageUploadLambda
Compress-Archive -Path * -DestinationPath image-upload.zip -Force

aws lambda create-function \
  --function-name ImageUploadLambda \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://image-upload.zip \
  --timeout 30 \
  --memory-size 256 \
  --region us-east-2
```

### 4. Add API Gateway Endpoints

```powershell
# Get API ID
$API_ID = aws apigatewayv2 get-apis --query "Items[?Name=='interon-email-api'].ApiId" --output text

# Create compliance check route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /compliance/check" \
  --target "integrations/INTEGRATION_ID"

# Create image upload route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /images/upload" \
  --target "integrations/INTEGRATION_ID"
```

## Testing

### Test Compliance Checker Locally

```powershell
python test-compliance.py
```

Expected output:
```
✅ ALL TESTS PASSED!
```

### Test via API

```powershell
# Test compliant email
curl -X POST https://YOUR_API_URL/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Software Engineer Position",
    "body": "Looking for experienced developers",
    "useAI": false
  }'

# Test non-compliant email
curl -X POST https://YOUR_API_URL/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "H1B Only",
    "body": "Bench sales position available",
    "useAI": false
  }'
```

## Configuration

### Bedrock Settings (Already Optimized)

```python
# Fast, accurate responses
temperature = 0.1      # Very low for strict compliance
max_tokens = 500       # Short responses
top_k = 10            # Reduced for speed
top_p = 0.9           # Focused responses
```

### IAM Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::interon-email-images/*"
    }
  ]
}
```

## Frontend Integration

### Add to API Endpoints (frontend code)

```javascript
const API_ENDPOINTS = {
  // ... existing endpoints
  COMPLIANCE: {
    CHECK: `${API_BASE}/compliance/check`
  },
  IMAGES: {
    UPLOAD: `${API_BASE}/images/upload`
  }
};
```

### Usage Example

```javascript
// Check compliance before sending
const checkCompliance = async (subject, body) => {
  const response = await fetch(API_ENDPOINTS.COMPLIANCE.CHECK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, body, useAI: false })
  });
  
  const result = await response.json();
  
  if (!result.isCompliant) {
    alert(`Compliance Issues Found:\n${result.suggestions.join('\n')}`);
    return false;
  }
  
  return true;
};

// Upload image
const uploadImage = async (file) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    
    const response = await fetch(API_ENDPOINTS.IMAGES.UPLOAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        filename: file.name,
        contentType: file.type
      })
    });
    
    const result = await response.json();
    return result.url;
  };
  
  reader.readAsDataURL(file);
};
```

## Monitoring

### CloudWatch Metrics

- `ComplianceCheckerLambda` - Invocations, Duration, Errors
- `ImageUploadLambda` - Invocations, Duration, Errors

### Logs

```powershell
# View compliance checker logs
aws logs tail /aws/lambda/ComplianceCheckerLambda --follow

# View image upload logs
aws logs tail /aws/lambda/ImageUploadLambda --follow
```

## Troubleshooting

### Issue: Bedrock Access Denied

**Solution**: Ensure Lambda execution role has `bedrock:InvokeModel` permission

### Issue: S3 Upload Fails

**Solution**: Check bucket exists and Lambda has `s3:PutObject` permission

### Issue: Slow Response Times

**Solution**: Already optimized! Using temperature=0.1 and max_tokens=500 for speed

---

**✅ Deployment Complete!**
