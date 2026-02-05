import boto3
import json

# Create API Gateway for send campaign endpoint
apigw = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

print("=== Creating API Gateway for Send Campaign ===\n")

# Step 1: Create HTTP API
print("1. Creating HTTP API...")
api_response = apigw.create_api(
    Name='email-agent-send-api',
    ProtocolType='HTTP',
    Description='API Gateway for email campaign sending',
    CorsConfiguration={
        'AllowOrigins': ['*'],
        'AllowMethods': ['POST', 'OPTIONS'],
        'AllowHeaders': ['Content-Type', 'Authorization'],
        'MaxAge': 300
    }
)

api_id = api_response['ApiId']
api_endpoint = api_response['ApiEndpoint']

print(f"✅ Created API: {api_id}")
print(f"   Endpoint: {api_endpoint}")

# Step 2: Create integration with SendCampaignLambda
print("\n2. Creating Lambda integration...")

# Get Lambda ARN
lambda_arn = f"arn:aws:lambda:us-east-2:397753625517:function:SendCampaignLambda"

integration_response = apigw.create_integration(
    ApiId=api_id,
    IntegrationType='AWS_PROXY',
    IntegrationUri=lambda_arn,
    PayloadFormatVersion='2.0'
)

integration_id = integration_response['IntegrationId']
print(f"✅ Created integration: {integration_id}")

# Step 3: Create route
print("\n3. Creating route...")
route_response = apigw.create_route(
    ApiId=api_id,
    RouteKey='POST /campaigns/{campaignId}/send',
    Target=f'integrations/{integration_id}'
)

print(f"✅ Created route: POST /campaigns/{{campaignId}}/send")

# Step 4: Create default stage
print("\n4. Creating $default stage...")
stage_response = apigw.create_stage(
    ApiId=api_id,
    StageName='$default',
    AutoDeploy=True
)

print(f"✅ Created stage: $default")

# Step 5: Grant API Gateway permission to invoke Lambda
print("\n5. Granting API Gateway permission...")

try:
    lambda_client.add_permission(
        FunctionName='SendCampaignLambda',
        StatementId=f'apigateway-{api_id}',
        Action='lambda:InvokeFunction',
        Principal='apigateway.amazonaws.com',
        SourceArn=f'arn:aws:execute-api:us-east-2:397753625517:{api_id}/*/*'
    )
    print(f"✅ Permission granted")
except lambda_client.exceptions.ResourceConflictException:
    print(f"⚠️  Permission already exists")

# Summary
print("\n" + "="*60)
print("✅ API Gateway Created Successfully!")
print("="*60)
print(f"\nAPI ID: {api_id}")
print(f"Endpoint: {api_endpoint}")
print(f"\nTest URL:")
print(f"{api_endpoint}/campaigns/test-123/send")
print(f"\nNote: The API ID is {api_id}, not 5cs5faz106")
print(f"You'll need to update frontend api.js to use this endpoint.")
