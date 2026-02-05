import boto3
import json
import requests

print("="*80)
print("SEND CAMPAIGN PIPELINE DIAGNOSTIC REPORT")
print("="*80)

# Initialize clients
lambda_client = boto3.client('lambda', region_name='us-east-2')
apigw = boto3.client('apigatewayv2', region_name='us-east-2')
ddb = boto3.resource('dynamodb', region_name='us-east-2')

# ============================================================================
# STEP 1: Check Frontend Configuration
# ============================================================================
print("\n" + "="*80)
print("STEP 1: FRONTEND CONFIGURATION")
print("="*80)

with open(r'Interon AI Email Agent\src\config\api.js', 'r') as f:
    api_config = f.read()
    
# Extract API URLs
import re
base_url_match = re.search(r"API_BASE_URL = '([^']+)'", api_config)
send_url_match = re.search(r"SEND_API_URL = '([^']+)'", api_config)

if base_url_match:
    print(f"✅ API_BASE_URL: {base_url_match.group(1)}")
else:
    print("❌ API_BASE_URL not found")

if send_url_match:
    print(f"✅ SEND_API_URL: {send_url_match.group(1)}")
else:
    print("⚠️  SEND_API_URL not configured (using API_BASE_URL)")

# Check SEND endpoint
send_endpoint_match = re.search(r"CAMPAIGN:.*?`([^`]+)`", api_config, re.DOTALL)
if send_endpoint_match:
    print(f"✅ SEND.CAMPAIGN endpoint pattern: {send_endpoint_match.group(1)}")

# ============================================================================
# STEP 2: Check API Gateway Configuration
# ============================================================================
print("\n" + "="*80)
print("STEP 2: API GATEWAY CONFIGURATION")
print("="*80)

# Check all APIs
apis = apigw.get_apis()['Items']
print(f"\nFound {len(apis)} API Gateways:")

for api in apis:
    api_id = api['ApiId']
    print(f"\n  API: {api['Name']}")
    print(f"  ID: {api_id}")
    print(f"  Endpoint: {api['ApiEndpoint']}")
    
    # Get routes
    try:
        routes = apigw.get_routes(ApiId=api_id)['Items']
        send_routes = [r for r in routes if 'send' in r['RouteKey'].lower()]
        
        if send_routes:
            print(f"  ⭐ HAS SEND ROUTE:")
            for route in send_routes:
                print(f"     - {route['RouteKey']}")
                if 'Target' in route:
                    integration_id = route['Target'].split('/')[-1]
                    try:
                        integration = apigw.get_integration(ApiId=api_id, IntegrationId=integration_id)
                        print(f"       Integration: {integration.get('IntegrationUri', 'N/A')}")
                    except:
                        pass
    except:
        pass

# ============================================================================
# STEP 3: Check SendCampaignLambda
# ============================================================================
print("\n" + "="*80)
print("STEP 3: SENDCAMPAIGNLAMBDA CONFIGURATION")
print("="*80)

try:
    func = lambda_client.get_function(FunctionName='SendCampaignLambda')
    config = func['Configuration']
    
    print(f"✅ Function exists: SendCampaignLambda")
    print(f"   Runtime: {config['Runtime']}")
    print(f"   Last Modified: {config['LastModified']}")
    print(f"   Timeout: {config['Timeout']}s")
    
    # Check environment variables
    env_vars = config.get('Environment', {}).get('Variables', {})
    
    print(f"\n   Environment Variables:")
    zoho_keys = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 
                 'ZOHO_ACCOUNT_ID', 'SOURCE_EMAIL']
    
    for key in zoho_keys:
        if key in env_vars:
            print(f"   ✅ {key}: ***")
        else:
            print(f"   ❌ {key}: MISSING")
    
    # Check Lambda permissions
    try:
        policy = lambda_client.get_policy(FunctionName='SendCampaignLambda')
        policy_doc = json.loads(policy['Policy'])
        print(f"\n   API Gateway Permissions:")
        for stmt in policy_doc['Statement']:
            if 'Condition' in stmt:
                source_arn = stmt.get('Condition', {}).get('ArnLike', {}).get('AWS:SourceArn', 'N/A')
                print(f"   ✅ {source_arn}")
    except:
        print(f"   ⚠️  No permissions found")
        
except Exception as e:
    print(f"❌ Error: {e}")

# ============================================================================
# STEP 4: Check DynamoDB Tables
# ============================================================================
print("\n" + "="*80)
print("STEP 4: DYNAMODB TABLES")
print("="*80)

# Check Campaigns table
try:
    campaigns_table = ddb.Table('Campaigns')
    response = campaigns_table.scan(Limit=5)
    print(f"✅ Campaigns table exists")
    print(f"   Sample campaigns: {len(response.get('Items', []))}")
    
    if response.get('Items'):
        for campaign in response['Items'][:2]:
            print(f"   - {campaign.get('campaignId')}: {campaign.get('subject', 'No subject')}")
except Exception as e:
    print(f"❌ Campaigns table error: {e}")

# Check Recipients table
try:
    recipients_table = ddb.Table('CampaignRecipients')
    response = recipients_table.scan(Limit=5)
    print(f"\n✅ CampaignRecipients table exists")
    print(f"   Sample recipients: {len(response.get('Items', []))}")
except Exception as e:
    print(f"❌ CampaignRecipients table error: {e}")

# ============================================================================
# STEP 5: Test API Endpoint
# ============================================================================
print("\n" + "="*80)
print("STEP 5: API ENDPOINT TEST")
print("="*80)

# Test the send endpoint
test_urls = [
    "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/campaigns/test-123/send",
    "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com/campaigns/test-123/send"
]

for url in test_urls:
    print(f"\nTesting: {url}")
    try:
        response = requests.post(url, json={"retry": False}, timeout=5)
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
    except requests.exceptions.Timeout:
        print(f"  ❌ Timeout")
    except Exception as e:
        print(f"  ❌ Error: {str(e)[:100]}")

# ============================================================================
# STEP 6: Check CloudWatch Logs
# ============================================================================
print("\n" + "="*80)
print("STEP 6: RECENT CLOUDWATCH LOGS")
print("="*80)

logs_client = boto3.client('logs', region_name='us-east-2')

try:
    # Get recent log events
    response = logs_client.filter_log_events(
        logGroupName='/aws/lambda/SendCampaignLambda',
        limit=10
    )
    
    print(f"Recent log events ({len(response.get('events', []))}):")
    for event in response.get('events', [])[-5:]:
        message = event['message'][:150]
        print(f"  {message}")
except Exception as e:
    print(f"❌ Error reading logs: {e}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "="*80)
print("DIAGNOSTIC SUMMARY")
print("="*80)

print("""
ISSUES TO CHECK:
1. Is SEND_API_URL properly configured in api.js?
2. Does API Gateway 5tdsq6s7h3 have the send route?
3. Is SendCampaignLambda connected to the API Gateway?
4. Are Zoho credentials configured?
5. Does the Lambda have permission to be invoked by API Gateway?
6. Are there any errors in CloudWatch logs?

NEXT STEPS:
- Review the output above
- Identify which step is failing
- Fix the specific issue
""")

print("="*80)
print("END OF DIAGNOSTIC REPORT")
print("="*80)
