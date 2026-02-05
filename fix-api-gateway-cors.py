import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
API_ID = '5tdsq6s7h3'

print("="*80)
print("FIXING API GATEWAY CORS CONFIGURATION")
print("="*80)

# Update CORS configuration
print("\nUpdating CORS configuration...")
try:
    response = apigateway.update_api(
        ApiId=API_ID,
        CorsConfiguration={
            'AllowOrigins': ['*'],
            'AllowMethods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            'AllowHeaders': [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers'
            ],
            'ExposeHeaders': ['*'],
            'MaxAge': 86400,
            'AllowCredentials': False
        }
    )
    print("✅ CORS configuration updated successfully")
    
    cors = response.get('CorsConfiguration', {})
    print(f"\nCORS Settings:")
    print(f"  AllowOrigins: {cors.get('AllowOrigins')}")
    print(f"  AllowMethods: {cors.get('AllowMethods')}")
    print(f"  AllowHeaders: {cors.get('AllowHeaders')}")
    print(f"  MaxAge: {cors.get('MaxAge')}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")

# Add OPTIONS route for /contacts if it doesn't exist
print("\n" + "="*80)
print("Adding OPTIONS routes...")
print("="*80)

routes_to_add = [
    'OPTIONS /contacts',
    'OPTIONS /campaigns',
    'OPTIONS /contacts/tags'
]

for route_key in routes_to_add:
    print(f"\nChecking: {route_key}")
    try:
        # Check if route exists
        routes = apigateway.get_routes(ApiId=API_ID)
        exists = any(r.get('RouteKey') == route_key for r in routes['Items'])
        
        if exists:
            print(f"  ⚠️  Already exists")
        else:
            # Create OPTIONS route with mock integration
            integration = apigateway.create_integration(
                ApiId=API_ID,
                IntegrationType='MOCK',
                PayloadFormatVersion='1.0',
                RequestTemplates={
                    'application/json': '{"statusCode": 200}'
                }
            )
            
            route = apigateway.create_route(
                ApiId=API_ID,
                RouteKey=route_key,
                Target=f"integrations/{integration['IntegrationId']}"
            )
            
            print(f"  ✅ Created OPTIONS route")
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")

print("\n" + "="*80)
print("CORS FIX COMPLETE")
print("="*80)
