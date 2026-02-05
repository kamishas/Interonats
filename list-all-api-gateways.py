import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')

print("="*80)
print("LISTING ALL API GATEWAYS IN us-east-2")
print("="*80)

apis = apigateway.get_apis()

print(f"\nTotal APIs: {len(apis['Items'])}")

for api in apis['Items']:
    print(f"\n{'='*80}")
    print(f"API Name: {api['Name']}")
    print(f"API ID: {api['ApiId']}")
    print(f"Endpoint: {api['ApiEndpoint']}")
    print(f"Protocol: {api['ProtocolType']}")
    print(f"Created: {api.get('CreatedDate')}")
    
    # Get routes for this API
    try:
        routes = apigateway.get_routes(ApiId=api['ApiId'])
        print(f"Routes: {len(routes['Items'])}")
        
        # Show contact/campaign routes
        relevant = [r for r in routes['Items'] if any(word in r.get('RouteKey', '').lower() for word in ['contact', 'campaign', 'send'])]
        if relevant:
            print(f"Relevant routes:")
            for r in relevant[:5]:
                print(f"  - {r.get('RouteKey')}")
    except:
        pass

print(f"\n{'='*80}")
print("RECOMMENDATION")
print("="*80)

print("\nIf there are multiple APIs, we might be using the wrong one!")
print("The working API should have routes for campaigns and send.")
