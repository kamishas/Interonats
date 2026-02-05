# Quick Reference Card 🚀

## Essential Commands

### Deployment Helper Script
```powershell
# Show all available commands
.\deploy.ps1 -Command help

# Pull latest code from AWS
.\deploy.ps1 -Command pull

# Deploy frontend to S3
.\deploy.ps1 -Command deploy-frontend

# Deploy a Lambda function
.\deploy.ps1 -Command deploy-lambda -LambdaFunction SendCampaignLambda

# List all AWS resources
.\deploy.ps1 -Command list-resources

# Test a Lambda function
.\deploy.ps1 -Command test-lambda -LambdaFunction GenerateEmailLambda
```

### AWS CLI Commands

#### S3 Operations
```powershell
# Download frontend
aws s3 sync s3://interon-email-agent-frontend-kamin/ ./frontend

# Upload frontend
aws s3 sync ./frontend/ s3://interon-email-agent-frontend-kamin/ --delete

# List S3 bucket contents
aws s3 ls s3://interon-email-agent-frontend-kamin/ --recursive
```

#### Lambda Operations
```powershell
# List all Lambda functions
aws lambda list-functions --region us-east-2

# Get Lambda function code
aws lambda get-function --function-name SendCampaignLambda --region us-east-2

# Update Lambda function code
aws lambda update-function-code `
  --function-name SendCampaignLambda `
  --zip-file fileb://function.zip `
  --region us-east-2

# Get Lambda environment variables
aws lambda get-function-configuration `
  --function-name SendCampaignLambda `
  --region us-east-2 `
  --query 'Environment.Variables'

# Invoke Lambda function
aws lambda invoke `
  --function-name GenerateEmailLambda `
  --payload file://test-event.json `
  --region us-east-2 `
  response.json
```

#### DynamoDB Operations
```powershell
# List all tables
aws dynamodb list-tables --region us-east-2

# Describe a table
aws dynamodb describe-table --table-name Campaigns --region us-east-2

# Scan table (get all items)
aws dynamodb scan --table-name Campaigns --region us-east-2

# Get specific item
aws dynamodb get-item `
  --table-name Campaigns `
  --key '{"campaignId": {"S": "your-campaign-id"}}' `
  --region us-east-2
```

## Lambda Functions

### GenerateEmailLambda
**Purpose**: Generate AI email variations  
**Runtime**: Python 3.9  
**File**: `lambda-functions/GenerateEmailLambda/generate_email.py`

**Test Event**:
```json
{
  "body": "{\"intent\": \"Cold outreach to CTOs\", \"tone\": \"Professional\", \"count\": 3}"
}
```

### ConfigureCampaignLambda
**Purpose**: Configure campaign (manual/auto mode)  
**Runtime**: Python 3.11  
**File**: `lambda-functions/ConfigureCampaignLambda/lambda_function.py`

**Test Event (Auto Mode)**:
```json
{
  "pathParameters": {"campaignId": "test-campaign-123"},
  "body": "{\"mode\": \"auto\", \"intent\": \"Cold outreach\", \"variationCount\": 3}"
}
```

### ListCampaignsLambda
**Purpose**: List all campaigns with stats  
**Runtime**: Python 3.9  
**File**: `lambda-functions/ListCampaignsLambda/list_campaigns.py`

**Test Event**:
```json
{}
```

### SendCampaignLambda
**Purpose**: Send emails to all recipients  
**Runtime**: Python 3.11  
**File**: `lambda-functions/SendCampaignLambda/lambda_function.py`

**Test Event**:
```json
{
  "pathParameters": {"campaignId": "your-campaign-id"}
}
```

## DynamoDB Tables

### Campaigns
**Primary Key**: `campaignId` (String)

**Example Item**:
```json
{
  "campaignId": "uuid-here",
  "campaignName": "Q1 Outreach",
  "status": "completed",
  "mode": "auto",
  "subject": "Let's connect",
  "autoTemplates": "[{...}]",
  "extraMeta": "{\"sender_name\": \"John\"}",
  "createdAt": "2025-12-24T10:00:00Z"
}
```

### CampaignRecipients
**Primary Key**: `campaignId` (Partition), `recipientId` (Sort)

**Example Item**:
```json
{
  "campaignId": "uuid-here",
  "recipientId": "recipient-uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "sent",
  "zohoMessageId": "msg-123"
}
```

## Placeholder Variables

Use these in email templates:
- `{{first_name}}` or `{{firstName}}` - Recipient's first name
- `{{last_name}}` or `{{lastName}}` - Recipient's last name
- `{{sender_name}}` - Sender's name
- `{{sender_company}}` - Sender's company
- `{{campaign_topic}}` - Campaign topic
- `{{company}}` - Sender's company (alias)

## URLs

**Frontend**: https://interon-email-agent-frontend-kamin.s3.us-east-2.amazonaws.com/index.html

**AWS Console**:
- Lambda: https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2
- DynamoDB: https://us-east-2.console.aws.amazon.com/dynamodbv2/home?region=us-east-2
- S3: https://s3.console.aws.amazon.com/s3/buckets/interon-email-agent-frontend-kamin

## Common Workflows

### Adding a New Feature to Lambda
```powershell
# 1. Edit the Lambda function
code ./lambda-functions/SendCampaignLambda/lambda_function.py

# 2. Test locally (if possible)
python ./lambda-functions/SendCampaignLambda/lambda_function.py

# 3. Deploy to AWS
.\deploy.ps1 -Command deploy-lambda -LambdaFunction SendCampaignLambda

# 4. Test in AWS
.\deploy.ps1 -Command test-lambda -LambdaFunction SendCampaignLambda
```

### Updating Frontend
```powershell
# 1. Edit frontend files
code ./frontend/index.html

# 2. Deploy to S3
.\deploy.ps1 -Command deploy-frontend

# 3. Test in browser
start https://interon-email-agent-frontend-kamin.s3.us-east-2.amazonaws.com/index.html
```

### Debugging Issues
```powershell
# View Lambda logs
aws logs tail /aws/lambda/SendCampaignLambda --follow --region us-east-2

# Get recent Lambda invocations
aws lambda list-functions --region us-east-2

# Check DynamoDB table
aws dynamodb scan --table-name Campaigns --region us-east-2 --max-items 5
```

## Environment Setup

### Required Environment Variables

**For SendCampaignLambda**:
```
CAMPAIGNS_TABLE=Campaigns
RECIPIENTS_TABLE=CampaignRecipients
ZOHO_BASE_URL=https://mail.zoho.com
ZOHO_ACCOUNT_ID=<your-account-id>
SOURCE_EMAIL=<your-email>
ZOHO_CLIENT_ID=<your-client-id>
ZOHO_CLIENT_SECRET=<your-client-secret>
ZOHO_REFRESH_TOKEN=<your-refresh-token>
```

**For ConfigureCampaignLambda**:
```
CAMPAIGNS_TABLE=Campaigns
MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-2
MAX_TOKENS=1024
TEMPERATURE=0.4
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Lambda timeout | Increase timeout in AWS Console (30s+) |
| CORS errors | Check Lambda CORS headers |
| Zoho auth failed | Verify refresh token in env vars |
| DynamoDB access denied | Check Lambda IAM role permissions |
| Frontend not updating | Clear browser cache, check S3 sync |

## File Locations

| Component | Path |
|-----------|------|
| Frontend | `./frontend/` |
| Lambda Functions | `./lambda-functions/` |
| Documentation | `./README.md`, `./PROJECT_OVERVIEW.md` |
| Deployment Script | `./deploy.ps1` |
| Git Ignore | `./.gitignore` |

---

**Region**: us-east-2 (Ohio)  
**Last Updated**: December 24, 2025
