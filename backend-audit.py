import boto3
import json
import time

print("="*80)
print("STRICT BACKEND AUDIT: RECIPIENT SYSTEM")
print("="*80)

def audit_dynamodb():
    print("\n1. AUDITING DYNAMODB TABLE")
    print("-" * 30)
    dynamodb = boto3.client('dynamodb', region_name='us-east-2')
    try:
        response = dynamodb.describe_table(TableName='CampaignRecipients')
        status = response['Table']['TableStatus']
        key_schema = response['Table']['KeySchema']
        print(f"✅ Table 'CampaignRecipients' exists. Status: {status}")
        print(f"   Key Schema: {key_schema}")
        
        # Scan for data
        scan = dynamodb.scan(TableName='CampaignRecipients', Limit=5)
        count = scan['Count']
        print(f"✅ Table contains {count} items (in sample scan).")
        if count > 0:
            print(f"   Sample Item: {scan['Items'][0]}")
        else:
            print("⚠️  Table appears EMPTY. This is a red flag.")
            
    except Exception as e:
        print(f"❌ DYNAMODB ERROR: {str(e)}")

def audit_lambda():
    print("\n2. AUDITING LAMBDA FUNCTION")
    print("-" * 30)
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    func_name = 'ManageRecipientsLambda'
    try:
        response = lambda_client.get_function(FunctionName=func_name)
        state = response['Configuration']['State']
        last_update = response['Configuration']['LastModified']
        print(f"✅ Function '{func_name}' exists. State: {state}")
        print(f"   Last Updated: {last_update}")
        
        # Check permissions (simplified check)
        # We can't fully check IAM policies easily via script without permission complexities, 
        # but we can try to invoke it dry.
        
    except Exception as e:
        print(f"❌ LAMBDA ERROR: {str(e)}")

def audit_api_gateway():
    print("\n3. AUDITING API GATEWAY ROUTE")
    print("-" * 30)
    apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
    api_id = '5tdsq6s7h3'
    
    try:
        # Check Route
        routes = apigateway.get_routes(ApiId=api_id)
        get_route = next((r for r in routes['Items'] if 'GET /campaigns/{campaignId}/recipients' in r.get('RouteKey', '')), None)
        
        if get_route:
            print(f"✅ Route 'GET /campaigns/{{campaignId}}/recipients' found. ID: {get_route['RouteId']}")
            target = get_route.get('Target', '')
            print(f"   Target: {target}")
            
            # Check Integration
            integration_id = target.split('/')[1]
            integration = apigateway.get_integration(ApiId=api_id, IntegrationId=integration_id)
            print(f"   Integration URI: {integration.get('IntegrationUri')}")
        else:
            print("❌ ROUTE MISSING: GET /campaigns/{campaignId}/recipients")
            
    except Exception as e:
        print(f"❌ API GATEWAY ERROR: {str(e)}")

def test_live_save_and_fetch():
    print("\n4. LIVE TRAFFIC TEST (Write -> Read)")
    print("-" * 30)
    import requests
    
    campaign_id = f"audit_test_{int(time.time())}"
    base_url = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"
    
    # payload
    payload = {
        "recipients": [
            {
                "email": "audit@test.com",
                "firstName": "Audit",
                "lastName": "User",
                "company": "AuditCorp",
                "status": "pending"
            }
        ]
    }
    
    print(f"   Testing Campaign ID: {campaign_id}")
    
    # 4a. Write
    print("   > Sending POST Request...")
    try:
        post_resp = requests.post(f"{base_url}/campaigns/{campaign_id}/recipients", json=payload, timeout=10)
        print(f"     POST Status: {post_resp.status_code}")
        print(f"     POST Body: {post_resp.text}")
    except Exception as e:
        print(f"     ❌ POST FAILED: {str(e)}")
        return

    # 4b. Read
    print("   > Sending GET Request...")
    try:
        get_resp = requests.get(f"{base_url}/campaigns/{campaign_id}/recipients", timeout=10)
        print(f"     GET Status: {get_resp.status_code}")
        data = get_resp.json()
        print(f"     GET Body: {data}")
        
        count = data.get('count', 0)
        if count == 1:
            print("   ✅ SUCCESS: Data Round-Trip Verified.")
        else:
            print(f"   ❌ FAILURE: Expected 1 recipient, got {count}.")
            
    except Exception as e:
        print(f"     ❌ GET FAILED: {str(e)}")

print("\nStarting Audit...")
audit_dynamodb()
audit_lambda()
audit_api_gateway()
test_live_save_and_fetch()
print("\n" + "="*80)
