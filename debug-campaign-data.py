import boto3
import json

print("="*80)
print("DEBUGGING CAMPAIGN DATA for 'ss'")
print("="*80)

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')
recipients_table = dynamodb.Table('CampaignRecipients')

# 1. SCAN for the campaign named "ss" (since we don't know the ID)
print("\n1. Searching for campaign 'ss'...")
try:
    response = campaigns_table.scan(
        FilterExpression="begins_with(#n, :name)",
        ExpressionAttributeNames={"#n": "name"},
        ExpressionAttributeValues={":name": "ss"}
    )
    
    items = response.get('Items', [])
    print(f"Found {len(items)} campaigns matching 'ss'")
    
    if not items:
        # Try searching by subject just in case
        print("  Checking subject field...")
        response = campaigns_table.scan(
            FilterExpression="begins_with(subject, :name)",
            ExpressionAttributeValues={":name": "ss"}
        )
        items = response.get('Items', [])
        print(f"  Found {len(items)} campaigns matching 'ss' in subject")

    for camp in items:
        print(f"\n--- CAMPAIGN: {camp.get('name', 'No Name')} ---")
        print(f"ID: {camp.get('campaignId')}")
        print(f"Subject: {camp.get('subject')}")
        print(f"Body: {camp.get('body')}")
        print(f"BodyTemplate: {camp.get('bodyTemplate')}")
        print(f"Recipients Count: {camp.get('totalRecipients')}")
        print(f"Status: {camp.get('status')}")
        
        # Check Recipients for this campaign
        print(f"  > Recipients in Table:")
        r_resp = recipients_table.query(
            KeyConditionExpression="campaignId = :cid",
            ExpressionAttributeValues={":cid": camp.get('campaignId')}
        )
        recipients = r_resp.get('Items', [])
        print(f"    Count: {len(recipients)}")
        if recipients:
            print(f"    First Recipient: {recipients[0]}")
            
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "="*80)
