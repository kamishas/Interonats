import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')

API_ID = '5tdsq6s7h3'

print("="*80)
print("CHECKING API GATEWAY ROUTES FOR RECIPIENTS AND CONFIG")
print("="*80)

routes = apigateway.get_routes(ApiId=API_ID)

# Check for recipient and config routes
recipient_routes = [r for r in routes['Items'] if 'recipient' in r.get('RouteKey', '').lower()]
config_routes = [r for r in routes['Items'] if 'config' in r.get('RouteKey', '').lower()]

print(f"\nRecipient routes ({len(recipient_routes)}):")
for route in recipient_routes:
    route_key = route.get('RouteKey')
    target = route.get('Target', 'NO TARGET')
    print(f"  {route_key} -> {target}")

print(f"\nConfig routes ({len(config_routes)}):")
for route in config_routes:
    route_key = route.get('RouteKey')
    target = route.get('Target', 'NO TARGET')
    print(f"  {route_key} -> {target}")

if not recipient_routes:
    print("\n❌ NO RECIPIENT ROUTES FOUND!")
    print("   Need to create POST /campaigns/{campaignId}/recipients")

if not config_routes:
    print("\n❌ NO CONFIG ROUTES FOUND!")
    print("   Need to create POST /campaigns/{campaignId}/config")

print(f"\n{'='*80}")
