import boto3
import json

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
API_ID = '5tdsq6s7h3'

print("="*80)
print("COMPLETELY OPENING CORS - NO RESTRICTIONS")
print("="*80)

# Update API Gateway CORS to be completely open
print("\nSetting CORS to allow EVERYTHING...")
try:
    response = apigateway.update_api(
        ApiId=API_ID,
        CorsConfiguration={
            'AllowOrigins': ['*'],
            'AllowMethods': ['*'],
            'AllowHeaders': ['*'],
            'ExposeHeaders': ['*'],
            'MaxAge': 86400,
            'AllowCredentials': False
        }
    )
    print("✅ CORS set to allow * for everything")
    print(f"   AllowOrigins: {response['CorsConfiguration']['AllowOrigins']}")
    print(f"   AllowMethods: {response['CorsConfiguration']['AllowMethods']}")
    print(f"   AllowHeaders: {response['CorsConfiguration']['AllowHeaders']}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

# Check current routes
print("\n" + "="*80)
print("CURRENT ROUTES")
print("="*80)

routes = apigateway.get_routes(ApiId=API_ID)
contact_routes = [r for r in routes['Items'] if 'contact' in r.get('RouteKey', '').lower()]

print(f"\nContact-related routes ({len(contact_routes)}):")
for route in contact_routes:
    print(f"  {route.get('RouteKey')}")

# Check if /contacts/tags exists
tags_route_exists = any(r.get('RouteKey') == 'GET /contacts/tags' for r in routes['Items'])
print(f"\nGET /contacts/tags exists: {tags_route_exists}")

if not tags_route_exists:
    print("\n⚠️  /contacts/tags route is MISSING - this is causing 500 errors")
    print("   Frontend is calling this endpoint but it doesn't exist")

print("\n" + "="*80)
