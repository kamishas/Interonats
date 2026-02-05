import boto3
import json

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("STEP 2: CHECKING API GATEWAY INTEGRATIONS")
print("="*80)

# Get all routes
routes = apigateway.get_routes(ApiId=API_ID)

print(f"\nTotal Routes: {len(routes['Items'])}")

# Focus on contact and campaign routes
relevant_routes = [r for r in routes['Items'] if any(word in r.get('RouteKey', '').lower() for word in ['contact', 'campaign'])]

print(f"Relevant Routes: {len(relevant_routes)}")

integration_status = {}

for route in relevant_routes:
    route_key = route.get('RouteKey')
    route_id = route.get('RouteId')
    target = route.get('Target', '')
    
    print(f"\n{'='*80}")
    print(f"Route: {route_key}")
    print(f"Route ID: {route_id}")
    
    if not target or 'integrations/' not in target:
        print(f"❌ NO INTEGRATION TARGET")
        integration_status[route_key] = 'NO_TARGET'
        continue
    
    integration_id = target.split('/')[-1]
    print(f"Integration ID: {integration_id}")
    
    try:
        # Get integration details
        integration = apigateway.get_integration(
            ApiId=API_ID,
            IntegrationId=integration_id
        )
        
        integration_type = integration.get('IntegrationType')
        integration_uri = integration.get('IntegrationUri', '')
        
        print(f"Integration Type: {integration_type}")
        print(f"Integration URI: {integration_uri}")
        
        if integration_type != 'AWS_PROXY':
            print(f"⚠️  Integration type should be AWS_PROXY")
            integration_status[route_key] = 'WRONG_TYPE'
            continue
        
        if not integration_uri:
            print(f"❌ NO INTEGRATION URI")
            integration_status[route_key] = 'NO_URI'
            continue
        
        # Extract Lambda function name from URI
        if 'function:' in integration_uri:
            func_name = integration_uri.split('function:')[-1]
            print(f"Lambda Function: {func_name}")
            
            # Check if Lambda exists
            try:
                lambda_client.get_function(FunctionName=func_name)
                print(f"✅ Lambda exists")
                integration_status[route_key] = 'OK'
            except:
                print(f"❌ Lambda doesn't exist")
                integration_status[route_key] = 'LAMBDA_MISSING'
        else:
            print(f"❌ Invalid Lambda URI")
            integration_status[route_key] = 'INVALID_URI'
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        integration_status[route_key] = 'ERROR'

print(f"\n{'='*80}")
print("INTEGRATION STATUS SUMMARY")
print("="*80)

ok_count = sum(1 for v in integration_status.values() if v == 'OK')
error_count = len(integration_status) - ok_count

print(f"\n✅ OK: {ok_count}/{len(integration_status)}")
print(f"❌ Issues: {error_count}/{len(integration_status)}")

print("\nDetailed Status:")
for route, status in integration_status.items():
    symbol = "✅" if status == "OK" else "❌"
    print(f"  {symbol} {route}: {status}")

print(f"\n{'='*80}")
