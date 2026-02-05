# Interon AI Email Agent - Project Overview

## 🎯 Project Summary
This is a **serverless AI-powered email campaign management system** built on AWS. It allows users to create, configure, and send personalized email campaigns using AI-generated content via AWS Bedrock (Claude 3.5 Sonnet) and Zoho Mail for delivery.

## 🏗️ Architecture Overview

### Frontend
- **Location**: S3 Bucket `interon-email-agent-frontend-kamin` (us-east-2)
- **URL**: https://interon-email-agent-frontend-kamin.s3.us-east-2.amazonaws.com/index.html
- **Tech Stack**: React application (bundled with Vite)
- **Files**:
  - `index.html` - Entry point
  - `assets/index-Cqena6zZ.js` - Main JavaScript bundle
  - `assets/index-DsVhWXsy.css` - Styles

### Backend - AWS Lambda Functions

#### 1. **GenerateEmailLambda** (Python 3.9)
- **Purpose**: Generate AI-powered email variations using AWS Bedrock
- **Model**: Claude 3.5 Sonnet (`us.anthropic.claude-3-5-sonnet-20240620-v1:0`)
- **Input**: 
  - `intent` - User's email goal/purpose
  - `tone` - Email tone (Professional, Casual, etc.)
  - `count` - Number of variations to generate (default: 3)
- **Output**: Array of email variations with subject and body
- **Features**:
  - Supports placeholder variables: `{{firstName}}`, `{{lastName}}`, `{{company}}`
  - Temperature: 0.7 for creative variations
  - Max tokens: 2000

#### 2. **ConfigureCampaignLambda** (Python 3.11)
- **Purpose**: Configure campaign settings (manual or AI-generated templates)
- **Model**: Claude 3.5 Sonnet v2 (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`)
- **Modes**:
  - **Manual Mode**: User provides subject and body template
  - **Auto Mode**: AI generates multiple template variations (1-10)
- **Input (Manual)**:
  ```json
  {
    "mode": "manual",
    "subject": "Email subject",
    "bodyTemplate": "Email body with {{first_name}} placeholders",
    "extraMeta": {
      "sender_name": "Name",
      "sender_company": "Company",
      "campaign_topic": "Topic"
    }
  }
  ```
- **Input (Auto)**:
  ```json
  {
    "mode": "auto",
    "intent": "Campaign goal",
    "audience": "Target audience",
    "callToAction": "Desired action",
    "variationCount": 5,
    "extraMeta": { ... }
  }
  ```
- **Environment Variables**:
  - `CAMPAIGNS_TABLE`: "Campaigns"
  - `MODEL_ID`: Claude 3.5 Sonnet v2
  - `MAX_TOKENS`: 1024
  - `TEMPERATURE`: 0.4
  - `TOP_K`: 250
  - `TOP_P`: 0.999

#### 3. **ListCampaignsLambda** (Python 3.9)
- **Purpose**: Retrieve all campaigns with recipient statistics
- **Features**:
  - Scans Campaigns table
  - Aggregates recipient stats (total, sent, failed)
  - Attaches full recipient list for each campaign
  - Sorts by creation date (newest first)
- **Output**: Array of campaigns with:
  - Campaign metadata
  - `totalRecipients`, `sentCount`, `failedCount`
  - Full `recipients` array

#### 4. **SendCampaignLambda** (Python 3.11)
- **Purpose**: Send personalized emails to all campaign recipients
- **Email Provider**: Zoho Mail API
- **Features**:
  - **Auto-refresh OAuth tokens** using refresh token
  - **Round-robin template selection** (for auto mode)
  - **Smart name extraction** from email if first name missing
  - **Placeholder rendering**: Supports both `{{key}}` and `{key}` formats
  - **Fallback logic**: Uses "Friend" if no name available
  - **HTML formatting**: Converts `\n` to `<br>` tags
- **Supported Placeholders**:
  - `{{first_name}}` / `{{firstName}}`
  - `{{last_name}}` / `{{lastName}}`
  - `{{sender_name}}`
  - `{{sender_company}}`
  - `{{campaign_topic}}`
  - `{{company}}`
- **Environment Variables**:
  - `CAMPAIGNS_TABLE`: "Campaigns"
  - `RECIPIENTS_TABLE`: "CampaignRecipients"
  - `ZOHO_BASE_URL`: "https://mail.zoho.com"
  - `ZOHO_ACCOUNT_ID`: Zoho account identifier
  - `SOURCE_EMAIL`: Sender email address
  - `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`: OAuth credentials

### Database - Amazon DynamoDB

#### Table 1: **Campaigns**
- **Primary Key**: `campaignId` (String)
- **Attributes**:
  - `campaignName` - Campaign display name
  - `status` - Campaign status (draft, sending, completed)
  - `mode` - "manual" or "auto"
  - `subject` - Email subject line
  - `bodyTemplate` - Email body (manual mode)
  - `autoTemplates` - JSON string of AI-generated templates (auto mode)
  - `extraMeta` - JSON string with sender info and campaign metadata
  - `createdAt` - Timestamp

#### Table 2: **CampaignRecipients**
- **Primary Key**: 
  - Partition Key: `campaignId` (String)
  - Sort Key: `recipientId` (String)
- **Attributes**:
  - `email` - Recipient email address
  - `firstName` - Recipient first name
  - `lastName` - Recipient last name
  - `status` - "pending", "sent", or "failed"
  - `zohoMessageId` - Zoho email message ID (if sent)
  - `errorMessage` - Error details (if failed)

## 🔐 Authentication & Security

### AWS Bedrock
- Uses IAM role-based authentication
- Region: us-east-2 (Ohio)
- Model: Claude 3.5 Sonnet (cross-region inference profile)

### Zoho Mail OAuth 2.0
- **Grant Type**: Refresh Token (permanent access)
- **Token Refresh**: Automatic on every send operation
- **Auth URL**: https://accounts.zoho.com/oauth/v2/token
- **Credentials**: Stored as Lambda environment variables

### CORS Configuration
- All Lambda functions have CORS headers enabled
- Allows origin: `*`
- Methods: `GET`, `POST`, `OPTIONS`

## 📊 Data Flow

### Campaign Creation Flow
1. User creates campaign via frontend
2. Frontend calls `ConfigureCampaignLambda`
3. Lambda stores campaign in DynamoDB
4. User uploads/adds recipients
5. Recipients stored in `CampaignRecipients` table

### Email Generation Flow (Auto Mode)
1. User provides intent, audience, CTA
2. `ConfigureCampaignLambda` calls AWS Bedrock
3. Claude generates 1-10 template variations
4. Templates stored as JSON in campaign record

### Email Sending Flow
1. User triggers send via frontend
2. `SendCampaignLambda` invoked
3. Lambda refreshes Zoho OAuth token
4. Fetches campaign config and recipients
5. For each recipient:
   - Selects template (round-robin for auto mode)
   - Renders placeholders with recipient data
   - Sends via Zoho Mail API
   - Updates recipient status in DynamoDB
6. Marks campaign as "completed"

## 🚀 Deployment Information

### Region
- **Primary Region**: us-east-2 (Ohio)

### S3 Bucket
- **Name**: `interon-email-agent-frontend-kamin`
- **Public Access**: Enabled for static website hosting
- **Contents**: React SPA build artifacts

### Lambda Functions
All functions are deployed in us-east-2 with:
- CORS enabled
- Environment variables configured
- IAM roles for DynamoDB and Bedrock access

## 🔧 Local Development Setup

### Prerequisites
- AWS CLI configured with credentials
- Access to us-east-2 region
- Node.js (for frontend development)
- Python 3.9+ (for Lambda development)

### Pulling Code from AWS
```powershell
# Configure AWS CLI
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set region us-east-2

# Download frontend
aws s3 sync s3://interon-email-agent-frontend-kamin/ ./frontend

# Download Lambda functions
aws lambda get-function --function-name GenerateEmailLambda --region us-east-2 --query 'Code.Location' --output text
# (Download and extract each Lambda function)
```

## 📝 Next Steps / Potential Features

### Suggested Enhancements
1. **Analytics Dashboard**
   - Email open rates (requires tracking pixels)
   - Click-through rates
   - Response rates

2. **A/B Testing**
   - Test different subject lines
   - Compare template performance
   - Automatic winner selection

3. **Scheduling**
   - Schedule campaigns for future dates
   - Drip campaigns (staggered sends)
   - Time zone optimization

4. **Advanced Personalization**
   - More placeholder variables (company, role, industry)
   - Dynamic content blocks
   - Conditional content

5. **Recipient Management**
   - Import from CSV/Excel
   - Contact list management
   - Unsubscribe handling
   - Bounce management

6. **Template Library**
   - Save successful templates
   - Template categories
   - Template sharing

7. **Multi-channel Support**
   - SMS integration
   - LinkedIn messaging
   - Slack integration

8. **Compliance**
   - GDPR compliance features
   - CAN-SPAM compliance
   - Opt-out management

## 🐛 Known Issues / Technical Debt

1. **Pagination**: `ListCampaignsLambda` uses `scan()` which won't scale well with many campaigns
2. **Error Handling**: Limited retry logic for failed sends
3. **Rate Limiting**: No rate limiting for Zoho API calls
4. **Monitoring**: No CloudWatch dashboards or alarms configured
5. **Testing**: No unit tests or integration tests
6. **Security**: Zoho credentials stored as environment variables (consider AWS Secrets Manager)

## 📚 API Endpoints

All Lambda functions are exposed via API Gateway (or Function URLs):

- `POST /generate-email` - Generate AI email variations
- `POST /campaigns/{campaignId}/config` - Configure campaign
- `GET /campaigns` - List all campaigns
- `POST /campaigns/{campaignId}/send` - Send campaign emails

---

**Last Updated**: December 24, 2025
**AWS Region**: us-east-2 (Ohio)
**Primary Technologies**: React, AWS Lambda, DynamoDB, Bedrock (Claude 3.5), Zoho Mail
