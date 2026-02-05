import boto3
import requests
import json
import time

campaign_id = f"test_send_{int(time.time())}"
base_url = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("DEBUGGING SEND CAMPAIGN FLOW")
print("="*80)

# 1. Check API Gateway Route
print("\n1. Checking API Gateway Route")
apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
api_id = '5tdsq6s7h3'

try:
    routes = apigateway.get_routes(ApiId=api_id)
    send_route = next((r for r in routes['Items'] if 'POST /campaigns/{campaignId}/send' in r.get('RouteKey', '')), None)
    
    if send_route:
        print(f"✅ Route 'POST /campaigns/{{campaignId}}/send' found. ID: {send_route['RouteId']}")
        print(f"   Target: {send_route.get('Target')}")
    else:
        print("❌ Route 'POST /campaigns/{campaignId}/send' NOT FOUND")
except Exception as e:
    print(f"❌ Error checking route: {str(e)}")

# 2. Check Lambda Function
print("\n2. Checking SendCampaignLambda")
lambda_client = boto3.client('lambda', region_name='us-east-2')
try:
    func = lambda_client.get_function(FunctionName='SendCampaignLambda')
    print(f"✅ Function 'SendCampaignLambda' found.")
    print(f"   State: {func['Configuration']['State']}")
except Exception as e:
    print(f"❌ SendCampaignLambda NOT FOUND or Error: {str(e)}")

# 3. Test Endpoint
print("\n3. Testing Send Endpoint (Dry Run)")
url = f"{base_url}/campaigns/1767584112/send" # Using the campaign ID from previous successful test
print(f"   POST {url}")

try:
    resp = requests.post(url, json={"retry": False}, timeout=15)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.text}")
except Exception as e:
    print(f"   ❌ Request Failed: {str(e)}")

print("\n" + "="*80)
