import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("FIXING API GATEWAY INTEGRATIONS")
print("="*80)

# Configuration for routes
routes_config = [
    {
        'route_key': 'POST /campaigns/{campaignId}/recipients',
        'lambda_name': 'ManageRecipientsLambda',
        'description': 'Manage campaign recipients'
    },
    {
        'route_key': 'POST /campaigns/{campaignId}/config',
        'lambda_name': 'ConfigureCampaignLambda',
        'description': 'Configure campaign content'
    }
]

for config in routes_config:
    print(f"\n{config['description']}")
    print(f"Route: {config['route_key']}")
    print("-"*80)
    
    lambda_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{config['lambda_name']}"
    
    try:
        # Check if route exists
        routes = apigateway.get_routes(ApiId=API_ID)
        existing_route = next((r for r in routes['Items'] if r.get('RouteKey') == config['route_key']), None)
        
        if existing_route:
            route_id = existing_route['RouteId']
            print(f"Route exists: {route_id}")
            
            # Delete old route
            apigateway.delete_route(ApiId=API_ID, RouteId=route_id)
            print("Deleted old route")
        
        # Create integration
        integration = apigateway.create_integration(
            ApiId=API_ID,
            IntegrationType='AWS_PROXY',
            IntegrationUri=lambda_arn,
            IntegrationMethod='POST',
            PayloadFormatVersion='2.0',
            TimeoutInMillis=30000
        )
        print(f"✅ Integration created: {integration['IntegrationId']}")
        
        # Create route
        route = apigateway.create_route(
            ApiId=API_ID,
            RouteKey=config['route_key'],
            Target=f"integrations/{integration['IntegrationId']}"
        )
        print(f"✅ Route created: {route['RouteId']}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

print(f"\n{'='*80}")
print("INTEGRATIONS FIXED!")
print("="*80)
