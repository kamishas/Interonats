import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("RECREATING CONTACT ROUTES FROM SCRATCH")
print("="*80)

# Step 1: Delete existing contact routes
print("\n1. Deleting existing contact routes...")
routes = apigateway.get_routes(ApiId=API_ID)
contact_routes = [r for r in routes['Items'] if 'contact' in r.get('RouteKey', '').lower()]

for route in contact_routes:
    route_id = route['RouteId']
    route_key = route['RouteKey']
    print(f"   Deleting: {route_key}")
    try:
        apigateway.delete_route(ApiId=API_ID, RouteId=route_id)
        print(f"   ✅ Deleted")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

# Step 2: Create new routes with proper integrations
print("\n2. Creating new routes...")

routes_to_create = [
    {'path': '/contacts', 'method': 'GET', 'lambda': 'ListContactsLambda'},
    {'path': '/contacts/tags', 'method': 'GET', 'lambda': 'ListContactTagsLambda'},
    {'path': '/contacts', 'method': 'POST', 'lambda': 'AddContactLambda'},
]

for route_config in routes_to_create:
    print(f"\n   Creating: {route_config['method']} {route_config['path']}")
    
    try:
        lambda_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{route_config['lambda']}"
        
        # Create integration
        integration = apigateway.create_integration(
            ApiId=API_ID,
            IntegrationType='AWS_PROXY',
            IntegrationUri=lambda_arn,
            IntegrationMethod='POST',
            PayloadFormatVersion='2.0',
            TimeoutInMillis=30000
        )
        print(f"     ✅ Integration created: {integration['IntegrationId']}")
        
        # Create route
        route = apigateway.create_route(
            ApiId=API_ID,
            RouteKey=f"{route_config['method']} {route_config['path']}",
            Target=f"integrations/{integration['IntegrationId']}"
        )
        print(f"     ✅ Route created: {route['RouteId']}")
        
        # Grant permission
        statement_id = f"apigateway-{route_config['method'].lower()}-{route_config['path'].replace('/', '-')}"
        try:
            lambda_client.add_permission(
                FunctionName=route_config['lambda'],
                StatementId=statement_id,
                Action='lambda:InvokeFunction',
                Principal='apigateway.amazonaws.com',
                SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*"
            )
            print(f"     ✅ Permission granted")
        except lambda_client.exceptions.ResourceConflictException:
            print(f"     ⚠️  Permission already exists")
            
    except Exception as e:
        print(f"     ❌ Error: {str(e)}")

print("\n" + "="*80)
print("ROUTES RECREATED")
print("="*80)
