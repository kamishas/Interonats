import boto3
import json
from datetime import datetime, timedelta

print("="*80)
print("COMPREHENSIVE EMAIL SENDING DIAGNOSTIC")
print("="*80)

# Initialize clients
lambda_client = boto3.client('lambda', region_name='us-east-2')
logs_client = boto3.client('logs', region_name='us-east-2')
ddb = boto3.resource('dynamodb', region_name='us-east-2')

# Step 1: Check Lambda Environment Variables
print("\n1. CHECKING SENDCAMPAIGNLAMBDA CONFIGURATION")
print("-"*80)

try:
    func = lambda_client.get_function(FunctionName='SendCampaignLambda')
    env_vars = func['Configuration'].get('Environment', {}).get('Variables', {})
    
    required_vars = [
        'ZOHO_CLIENT_ID',
        'ZOHO_CLIENT_SECRET', 
        'ZOHO_REFRESH_TOKEN',
        'ZOHO_ACCOUNT_ID',
        'SOURCE_EMAIL',
        'CAMPAIGNS_TABLE',
        'RECIPIENTS_TABLE'
    ]
    
    print("Environment Variables:")
    for var in required_vars:
        if var in env_vars:
            if 'SECRET' in var or 'TOKEN' in var:
                print(f"  ✅ {var}: ***{env_vars[var][-4:]}")
            else:
                print(f"  ✅ {var}: {env_vars[var]}")
        else:
            print(f"  ❌ {var}: MISSING!")
            
except Exception as e:
    print(f"❌ Error: {e}")

# Step 2: Check Recent Lambda Executions
print("\n2. CHECKING RECENT LAMBDA EXECUTIONS")
print("-"*80)

try:
    # Get log streams from last hour
    end_time = int(datetime.now().timestamp() * 1000)
    start_time = int((datetime.now() - timedelta(hours=1)).timestamp() * 1000)
    
    response = logs_client.filter_log_events(
        logGroupName='/aws/lambda/SendCampaignLambda',
        startTime=start_time,
        endTime=end_time,
        limit=50
    )
    
    events = response.get('events', [])
    print(f"Found {len(events)} log events in last hour")
    
    if events:
        print("\nRecent logs:")
        for event in events[-10:]:  # Last 10 events
            timestamp = datetime.fromtimestamp(event['timestamp']/1000)
            message = event['message'].strip()
            print(f"  [{timestamp.strftime('%H:%M:%S')}] {message[:150]}")
            
        # Look for errors
        errors = [e for e in events if 'error' in e['message'].lower() or 'exception' in e['message'].lower()]
        if errors:
            print(f"\n⚠️  Found {len(errors)} error messages:")
            for err in errors[-3:]:
                print(f"  {err['message'][:200]}")
    else:
        print("⚠️  No recent executions found!")
        
except Exception as e:
    print(f"❌ Error reading logs: {e}")

# Step 3: Check Campaign and Recipient Data
print("\n3. CHECKING CAMPAIGN DATA")
print("-"*80)

campaign_id = '1766597418206'

try:
    campaigns_table = ddb.Table('Campaigns')
    campaign = campaigns_table.get_item(Key={'campaignId': campaign_id})['Item']
    
    print(f"Campaign: {campaign_id}")
    print(f"  Subject: {campaign.get('subject')}")
    print(f"  Body: {campaign.get('body', 'N/A')}")
    print(f"  BodyTemplate: {campaign.get('bodyTemplate', 'N/A')[:50]}...")
    print(f"  Status: {campaign.get('status')}")
    
    # Check recipients
    recipients_table = ddb.Table('CampaignRecipients')
    recip_response = recipients_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('campaignId').eq(campaign_id)
    )
    recipients = recip_response.get('Items', [])
    
    print(f"\nRecipients: {len(recipients)}")
    for r in recipients:
        print(f"  - {r.get('email')}: {r.get('status', 'pending')} (Last: {r.get('sentAt', 'never')})")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Step 4: Test Lambda Invocation Directly
print("\n4. TESTING LAMBDA INVOCATION")
print("-"*80)

try:
    print("Invoking SendCampaignLambda directly...")
    
    test_event = {
        "pathParameters": {
            "campaignId": campaign_id
        },
        "body": json.dumps({"retry": False})
    }
    
    response = lambda_client.invoke(
        FunctionName='SendCampaignLambda',
        InvocationType='RequestResponse',
        Payload=json.dumps(test_event)
    )
    
    result = json.loads(response['Payload'].read())
    print(f"\nLambda Response:")
    print(f"  Status Code: {result.get('statusCode')}")
    
    if 'body' in result:
        body = json.loads(result['body']) if isinstance(result['body'], str) else result['body']
        print(f"  Body: {json.dumps(body, indent=2)}")
    
    if 'errorMessage' in result:
        print(f"  ❌ Error: {result['errorMessage']}")
        
except Exception as e:
    print(f"❌ Invocation failed: {e}")

print("\n" + "="*80)
print("DIAGNOSTIC COMPLETE")
print("="*80)
