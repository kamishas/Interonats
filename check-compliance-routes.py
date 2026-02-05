import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')

API_ID = '5tdsq6s7h3'

print("="*80)
print("CHECKING API GATEWAY ROUTES")
print("="*80)

routes = apigateway.get_routes(ApiId=API_ID)

# Check for compliance routes
compliance_routes = [r for r in routes['Items'] if 'compliance' in r.get('RouteKey', '').lower() or 'image' in r.get('RouteKey', '').lower()]

print(f"\nCompliance/Image routes ({len(compliance_routes)}):")
for route in compliance_routes:
    print(f"  {route.get('RouteKey')}")

# Check if /compliance/check exists
has_compliance_check = any(r.get('RouteKey') == 'POST /compliance/check' for r in routes['Items'])
has_images = any(r.get('RouteKey') == 'POST /images' for r in routes['Items'])

print(f"\n✅ POST /images: {'EXISTS' if has_images else 'MISSING'}")
print(f"{'✅' if has_compliance_check else '❌'} POST /compliance/check: {'EXISTS' if has_compliance_check else 'MISSING'}")

if not has_compliance_check:
    print("\n⚠️  /compliance/check route is MISSING")
    print("   This is needed for subject/body text compliance checking")

print(f"\n{'='*80}")
