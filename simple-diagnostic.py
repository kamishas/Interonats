import boto3
import json

print("SEND CAMPAIGN DIAGNOSTIC")
print("="*60)

# Check API config file
print("\n1. FRONTEND API CONFIG:")
try:
    with open(r'Interon AI Email Agent\src\config\api.js', 'r') as f:
        content = f.read()
        if 'SEND_API_URL' in content:
            print("   ✅ SEND_API_URL is configured")
        else:
            print("   ❌ SEND_API_URL NOT found - using API_BASE_URL")
        
        if '5cs5faz106' in content:
            print("   ✅ API_BASE_URL uses 5cs5faz106")
        
        if '5tdsq6s7h3' in content:
            print("   ✅ SEND_API_URL uses 5tdsq6s7h3")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check Lambda
print("\n2. SENDCAMPAIGNLAMBDA:")
lambda_client = boto3.client('lambda', region_name='us-east-2')
try:
    func = lambda_client.get_function(FunctionName='SendCampaignLambda')
    config = func['Configuration']
    print(f"   ✅ Lambda exists")
    print(f"   Last Modified: {config['LastModified']}")
    
    env = config.get('Environment', {}).get('Variables', {})
    zoho_keys = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN']
    
    for key in zoho_keys:
        if key in env:
            print(f"   ✅ {key} configured")
        else:
            print(f"   ❌ {key} MISSING")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Check API Gateway
print("\n3. API GATEWAY:")
apigw = boto3.client('apigatewayv2', region_name='us-east-2')
try:
    apis = apigw.get_apis()['Items']
    
    for api in apis:
        if api['ApiId'] == '5tdsq6s7h3':
            print(f"   ✅ Found API: {api['ApiId']}")
            print(f"   Endpoint: {api['ApiEndpoint']}")
            
            routes = apigw.get_routes(ApiId=api['ApiId'])['Items']
            for route in routes:
                print(f"   Route: {route['RouteKey']}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*60)
print("DIAGNOSIS COMPLETE")
