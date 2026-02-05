import boto3
import json

# Initialize clients
apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

# Use existing API Gateway
API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("CONFIGURING ALL API GATEWAY ROUTES FOR PRODUCTION")
print("="*80)

# All routes to create
routes = [
    # Campaign Management
    {
        'path': '/campaigns',
        'method': 'GET',
        'lambda': 'ListCampaignsLambda',
        'description': 'List all campaigns'
    },
    {
        'path': '/campaigns',
        'method': 'POST',
        'lambda': 'CreateCampaignLambda',
        'description': 'Create new campaign'
    },
    {
        'path': '/campaigns/{campaignId}',
        'method': 'GET',
        'lambda': 'GetCampaignLambda',
        'description': 'Get campaign details'
    },
    {
        'path': '/campaigns/{campaignId}/config',
        'method': 'POST',
        'lambda': 'ConfigureCampaignLambda',
        'description': 'Configure campaign'
    },
    {
        'path': '/campaigns/{campaignId}/recipients',
        'method': 'POST',
        'lambda': 'ManageRecipientsLambda',
        'description': 'Add recipients'
    },
    {
        'path': '/campaigns/{campaignId}/recipients',
        'method': 'GET',
        'lambda': 'ManageRecipientsLambda',
        'description': 'List recipients'
    },
    {
        'path': '/campaigns/{campaignId}/recipients/{recipientId}',
        'method': 'DELETE',
        'lambda': 'ManageRecipientsLambda',
        'description': 'Delete recipient'
    },
    # Contact Management
    {
        'path': '/contacts',
        'method': 'GET',
        'lambda': 'ListContactsLambda',
        'description': 'List all contacts'
    },
    {
        'path': '/contacts',
        'method': 'POST',
        'lambda': 'AddContactLambda',
        'description': 'Add/update contact'
    },
    {
        'path': '/contacts/{contactId}',
        'method': 'DELETE',
        'lambda': 'DeleteContactLambda',
        'description': 'Delete contact'
    }
]

print(f"\nAPI Gateway: {API_ID}")
print(f"API URL: https://{API_ID}.execute-api.{REGION}.amazonaws.com")
print(f"\nConfiguring {len(routes)} routes...")

created_count = 0
updated_count = 0
error_count = 0

for route_config in routes:
    print(f"\n{'='*80}")
    print(f"{route_config['method']} {route_config['path']}")
    print(f"Description: {route_config['description']}")
    print(f"Lambda: {route_config['lambda']}")
    
    try:
        lambda_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{route_config['lambda']}"
        
        # Create integration
        integration_response = apigateway.create_integration(
            ApiId=API_ID,
            IntegrationType='AWS_PROXY',
            IntegrationUri=lambda_arn,
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
                FunctionName=route_config['lambda'],
                StatementId=statement_id,
                Action='lambda:InvokeFunction',
                Principal='apigateway.amazonaws.com',
                SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*"
            )
            print(f"✅ Granted Lambda invoke permission")
        except lambda_client.exceptions.ResourceConflictException:
            print(f"⚠️  Permission already exists (skipping)")
        
        created_count += 1
        
    except apigateway.exceptions.ConflictException:
        print(f"⚠️  Route already exists (skipping)")
        updated_count += 1
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        error_count += 1

# Configure CORS
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

print(f"\n{'='*80}")
print("API GATEWAY CONFIGURATION COMPLETE!")
print("="*80)
print(f"\n📊 Summary:")
print(f"  ✅ Created: {created_count} routes")
print(f"  ⚠️  Skipped: {updated_count} routes (already exist)")
print(f"  ❌ Errors: {error_count} routes")
print(f"\n🌐 API Base URL: https://{API_ID}.execute-api.{REGION}.amazonaws.com")
print(f"\n📋 Total Endpoints: {len(routes)}")
print("\nAll routes:")
for route in routes:
    print(f"  {route['method']:6} {route['path']}")
