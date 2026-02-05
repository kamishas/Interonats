import boto3
import json

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')

API_ID = '5tdsq6s7h3'

print("="*80)
print("CHECKING API GATEWAY INTEGRATIONS")
print("="*80)

# Get all integrations
integrations = apigateway.get_integrations(ApiId=API_ID)

print(f"\nTotal Integrations: {len(integrations['Items'])}")

for integration in integrations['Items']:
    integration_id = integration['IntegrationId']
    integration_uri = integration.get('IntegrationUri', 'N/A')
    integration_type = integration.get('IntegrationType', 'N/A')
    
    print(f"\nIntegration ID: {integration_id}")
    print(f"  Type: {integration_type}")
    print(f"  URI: {integration_uri}")
    
    # Check which routes use this integration
    routes = apigateway.get_routes(ApiId=API_ID)
    for route in routes['Items']:
        if route.get('Target', '').endswith(integration_id):
            print(f"  Route: {route.get('RouteKey', 'N/A')}")

print(f"\n{'='*80}")
print("Checking CORS...")

api_info = apigateway.get_api(ApiId=API_ID)
cors = api_info.get('CorsConfiguration', {})

print(f"CORS Configuration:")
print(f"  AllowOrigins: {cors.get('AllowOrigins', 'NOT SET')}")
print(f"  AllowMethods: {cors.get('AllowMethods', 'NOT SET')}")
print(f"  AllowHeaders: {cors.get('AllowHeaders', 'NOT SET')}")

print(f"\n{'='*80}")
