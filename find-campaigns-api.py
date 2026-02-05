import boto3

apigw = boto3.client('apigatewayv2', region_name='us-east-2')

print("Searching for /campaigns endpoint...")
print("="*60)

apis = apigw.get_apis()['Items']

for api in apis:
    api_id = api['ApiId']
    api_name = api['Name']
    
    try:
        routes = apigw.get_routes(ApiId=api_id)['Items']
        campaign_routes = [r for r in routes if 'campaign' in r['RouteKey'].lower()]
        
        if campaign_routes:
            print(f"\n✅ API: {api_name}")
            print(f"   ID: {api_id}")
            print(f"   Endpoint: {api['ApiEndpoint']}")
            print(f"   Campaign Routes:")
            for route in campaign_routes:
                print(f"     - {route['RouteKey']}")
    except:
        pass

print("\n" + "="*60)
print("RECOMMENDATION:")
print("Use API ID with /campaigns GET route for API_BASE_URL")
