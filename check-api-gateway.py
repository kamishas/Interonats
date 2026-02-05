import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')

API_ID = '5tdsq6s7h3'

print("="*80)
print("CHECKING API GATEWAY ROUTES AND CORS")
print("="*80)

# Get all routes
routes = apigateway.get_routes(ApiId=API_ID)

print(f"\n📋 Configured Routes ({len(routes['Items'])} total):")
for route in routes['Items']:
    print(f"  {route.get('RouteKey', 'N/A')}")

# Get CORS configuration
api_info = apigateway.get_api(ApiId=API_ID)
cors = api_info.get('CorsConfiguration', {})

print(f"\n🌐 CORS Configuration:")
print(f"  Allow Origins: {cors.get('AllowOrigins', 'NOT SET')}")
print(f"  Allow Methods: {cors.get('AllowMethods', 'NOT SET')}")
print(f"  Allow Headers: {cors.get('AllowHeaders', 'NOT SET')}")

# Get integrations
integrations = apigateway.get_integrations(ApiId=API_ID)

print(f"\n🔗 Integrations ({len(integrations['Items'])} total):")
for integration in integrations['Items']:
    print(f"  {integration.get('IntegrationId')}: {integration.get('IntegrationUri', 'N/A')}")

print(f"\n{'='*80}")
print("API Gateway check complete")
print("="*80)
