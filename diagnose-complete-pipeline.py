import boto3
import requests
import json

print("="*80)
print("COMPLETE PIPELINE DIAGNOSIS")
print("="*80)

# Step 1: Check Frontend Configuration
print("\n1. FRONTEND CONFIGURATION")
print("-"*80)
try:
    with open(r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\config\api.js', 'r') as f:
        content = f.read()
    import re
    api_base = re.search(r"const API_BASE_URL = '([^']+)'", content)
    if api_base:
        print(f"✅ API_BASE_URL: {api_base.group(1)}")
    else:
        print("❌ API_BASE_URL not found")
except Exception as e:
    print(f"❌ Error: {e}")

# Step 2: Test API Gateway Directly
API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"
print(f"\n2. API GATEWAY DIRECT TEST")
print("-"*80)

endpoints_to_test = [
    "/contacts",
    "/contacts/tags",
    "/campaigns"
]

for endpoint in endpoints_to_test:
    print(f"\nTesting: {endpoint}")
    try:
        response = requests.get(f"{API_BASE}{endpoint}", timeout=5)
        print(f"  Status: {response.status_code}")
        print(f"  CORS: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        if response.status_code == 200:
            print(f"  ✅ SUCCESS")
        else:
            print(f"  ❌ FAILED")
            print(f"  Response: {response.text[:200]}")
    except Exception as e:
        print(f"  ❌ ERROR: {str(e)}")

# Step 3: Check Lambda Functions
print(f"\n3. LAMBDA FUNCTIONS")
print("-"*80)

lambda_client = boto3.client('lambda', region_name='us-east-2')
functions_to_check = [
    'ListContactsLambda',
    'ListCampaignsLambda'
]

for func_name in functions_to_check:
    print(f"\n{func_name}:")
    try:
        response = lambda_client.invoke(
            FunctionName=func_name,
            InvocationType='RequestResponse'
        )
        payload = json.loads(response['Payload'].read())
        if payload.get('statusCode') == 200:
            print(f"  ✅ Returns 200 OK")
        else:
            print(f"  ❌ Error: {payload}")
    except Exception as e:
        print(f"  ❌ ERROR: {str(e)}")

# Step 4: Check API Gateway Routes
print(f"\n4. API GATEWAY ROUTES")
print("-"*80)

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
API_ID = '5tdsq6s7h3'

routes = apigateway.get_routes(ApiId=API_ID)
print(f"Total routes: {len(routes['Items'])}")

for route in routes['Items']:
    route_key = route.get('RouteKey', 'N/A')
    if 'contact' in route_key.lower() or 'campaign' in route_key.lower():
        print(f"  {route_key}")

# Step 5: Check Integrations
print(f"\n5. API GATEWAY INTEGRATIONS")
print("-"*80)

integrations = apigateway.get_integrations(ApiId=API_ID)
print(f"Total integrations: {len(integrations['Items'])}")

for integration in integrations['Items']:
    uri = integration.get('IntegrationUri', '')
    if 'Contact' in uri or 'Campaign' in uri:
        print(f"  {uri.split(':')[-1] if ':' in uri else uri}")

print(f"\n{'='*80}")
print("DIAGNOSIS COMPLETE")
print("="*80)
