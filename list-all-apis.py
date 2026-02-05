import boto3

# List ALL API Gateways to find 5cs5faz106
apigw = boto3.client('apigatewayv2', region_name='us-east-2')

print("=== ALL API Gateways in us-east-2 ===\n")

apis = apigw.get_apis()['Items']

found_target = False
for api in apis:
    api_id = api['ApiId']
    print(f"API ID: {api_id}")
    print(f"Name: {api['Name']}")
    print(f"Endpoint: {api['ApiEndpoint']}")
    
    if api_id == '5cs5faz106':
        found_target = True
        print("  ⭐ THIS IS THE ONE FRONTEND IS USING!")
    
    print()

if not found_target:
    print("❌ API Gateway '5cs5faz106' NOT FOUND!")
    print("\n=== Solution Options ===")
    print("1. Update frontend to use existing API: 03qcyfu729")
    print("2. Create new API Gateway with custom domain")
    print("3. Check if 5cs5faz106 exists in different region")
