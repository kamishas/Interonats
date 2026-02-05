import boto3

c = boto3.client('apigatewayv2', region_name='us-east-2')

# Get dev-onehr-backend API
apis = c.get_apis()['Items']
api = [a for a in apis if a['Name'] == 'dev-onehr-backend'][0]

print(f"✅ Found Email Agent API Gateway!")
print(f"\nAPI ID: {api['ApiId']}")
print(f"Endpoint: {api['ApiEndpoint']}")
print(f"\n=== Campaign Routes ===")

routes = c.get_routes(ApiId=api['ApiId'])['Items']
campaign_routes = [r for r in routes if 'campaign' in r['RouteKey'].lower() or 'send' in r['RouteKey'].lower()]

for route in campaign_routes:
    print(f"\n{route['RouteKey']}")
    if 'Target' in route:
        print(f"  Target: {route['Target']}")

print(f"\n\n🔧 CORRECT API BASE URL:")
print(f"{api['ApiEndpoint']}/prod")
