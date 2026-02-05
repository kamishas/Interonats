import boto3
import json

# Initialize clients
apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

# Use existing API Gateway (the one for send campaign)
API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '975050348008'

print("="*80)
print("CONFIGURING API GATEWAY ROUTES FOR CAMPAIGN MANAGEMENT")
print("="*80)

# Get Lambda ARNs
manage_recipients_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:ManageRecipientsLambda"
configure_campaign_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:ConfigureCampaignLambda"
get_campaign_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:GetCampaignLambda"

# Routes to create
routes = [
    {
        'path': '/campaigns/{campaignId}/recipients',
        'method': 'POST',
        'lambda_arn': manage_recipients_arn,
        'description': 'Add recipients to campaign'
    },
    {
        'path': '/campaigns/{campaignId}/recipients',
        'method': 'GET',
        'lambda_arn': manage_recipients_arn,
        'description': 'List campaign recipients'
    },
    {
        'path': '/campaigns/{campaignId}/recipients/{recipientId}',
        'method': 'DELETE',
        'lambda_arn': manage_recipients_arn,
        'description': 'Delete recipient'
    },
    {
        'path': '/campaigns/{campaignId}/config',
        'method': 'POST',
        'lambda_arn': configure_campaign_arn,
        'description': 'Configure campaign'
    },
    {
        'path': '/campaigns/{campaignId}',
        'method': 'GET',
        'lambda_arn': get_campaign_arn,
        'description': 'Get campaign details'
    }
]

print(f"\nUsing API Gateway: {API_ID}")
print(f"API URL: https://{API_ID}.execute-api.{REGION}.amazonaws.com")

# Create integrations and routes
for route_config in routes:
    print(f"\n{'='*80}")
    print(f"Creating route: {route_config['method']} {route_config['path']}")
    print(f"Description: {route_config['description']}")
    
    try:
        # Create integration
        integration_response = apigateway.create_integration(
            ApiId=API_ID,
            IntegrationType='AWS_PROXY',
            IntegrationUri=route_config['lambda_arn'],
            PayloadFormatVersion='2.0'
        )
        
        integration_id = integration_response['IntegrationId']
        print(f"✅ Created integration: {integration_id}")
        
        # Create route
        route_key = f"{route_config['method']} {route_config['path']}"
        route_response = apigateway.create_route(
            ApiId=API_ID,
            RouteKey=route_key,
            Target=f"integrations/{integration_id}"
        )
        
        route_id = route_response['RouteId']
        print(f"✅ Created route: {route_id}")
        
        # Grant API Gateway permission to invoke Lambda
        statement_id = f"apigateway-{route_config['method'].lower()}-{route_config['path'].replace('/', '-').replace('{', '').replace('}', '')}"
        
        try:
            lambda_client.add_permission(
                FunctionName=route_config['lambda_arn'].split(':')[-1],
                StatementId=statement_id,
                Action='lambda:InvokeFunction',
                Principal='apigateway.amazonaws.com',
                SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*"
            )
            print(f"✅ Granted Lambda invoke permission")
        except lambda_client.exceptions.ResourceConflictException:
            print(f"⚠️  Permission already exists (skipping)")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

# Create CORS configuration
print(f"\n{'='*80}")
print("Configuring CORS...")

try:
    apigateway.update_api(
        ApiId=API_ID,
        CorsConfiguration={
            'AllowOrigins': ['*'],
            'AllowMethods': ['GET', 'POST', 'DELETE', 'OPTIONS'],
            'AllowHeaders': ['Content-Type', 'Authorization'],
            'MaxAge': 300
        }
    )
    print("✅ CORS configured successfully")
except Exception as e:
    print(f"❌ Error configuring CORS: {str(e)}")

# Deploy API
print(f"\n{'='*80}")
print("Deploying API Gateway...")

try:
    # Get or create $default stage
    stages = apigateway.get_stages(ApiId=API_ID)
    
    if not any(stage['StageName'] == '$default' for stage in stages['Items']):
        apigateway.create_stage(
            ApiId=API_ID,
            StageName='$default',
            AutoDeploy=True
        )
        print("✅ Created $default stage with auto-deploy")
    else:
        print("✅ Using existing $default stage")
    
except Exception as e:
    print(f"❌ Error deploying: {str(e)}")

print(f"\n{'='*80}")
print("API GATEWAY CONFIGURATION COMPLETE!")
print("="*80)
print(f"\nAPI Base URL: https://{API_ID}.execute-api.{REGION}.amazonaws.com")
print("\nAvailable Endpoints:")
for route in routes:
    print(f"  {route['method']:6} {route['path']}")

print("\nNext steps:")
print("1. Update frontend api.js with this base URL")
print("2. Test endpoints with Postman or curl")
print("3. Integrate with frontend")
