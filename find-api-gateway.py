import boto3

# Check API Gateway routes
client = boto3.client('apigatewayv2', region_name='us-east-2')

# List ALL APIs
print("=== All API Gateways ===")
apis = client.get_apis()['Items']
for api in apis:
    print(f"\nAPI ID: {api['ApiId']}")
    print(f"Name: {api['Name']}")
    print(f"Endpoint: {api.get('ApiEndpoint', 'N/A')}")
    
    # Check if this might be the email agent API
    if 'email' in api['Name'].lower() or 'interon' in api['Name'].lower() or 'campaign' in api['Name'].lower():
        print("  ⭐ POSSIBLE EMAIL AGENT API")
        
        # List routes for this API
        try:
            routes = client.get_routes(ApiId=api['ApiId'])['Items']
            print(f"  Routes ({len(routes)}):")
            for route in routes:
                print(f"    - {route['RouteKey']}")
        except Exception as e:
            print(f"    Error listing routes: {e}")
