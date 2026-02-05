import boto3
import json

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
API_ID = '5tdsq6s7h3'

print("="*80)
print("CHECKING API GATEWAY ROUTES AND INTEGRATIONS")
print("="*80)

# Get all routes
routes = apigateway.get_routes(ApiId=API_ID)

contact_routes = [r for r in routes['Items'] if 'contact' in r.get('RouteKey', '').lower()]

print(f"\nContact-related routes ({len(contact_routes)}):")
for route in contact_routes:
    route_key = route.get('RouteKey')
    route_id = route.get('RouteId')
    target = route.get('Target', 'NO TARGET')
    
    print(f"\n  Route: {route_key}")
    print(f"    ID: {route_id}")
    print(f"    Target: {target}")
    
    # Get integration details
    if target and 'integrations/' in target:
        integration_id = target.split('/')[-1]
        try:
            integration = apigateway.get_integration(
                ApiId=API_ID,
                IntegrationId=integration_id
            )
            print(f"    Integration Type: {integration.get('IntegrationType')}")
            print(f"    Integration URI: {integration.get('IntegrationUri', 'N/A')}")
        except Exception as e:
            print(f"    ❌ Integration error: {str(e)}")

print(f"\n{'='*80}")
