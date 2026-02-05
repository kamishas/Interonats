import boto3
import json

ddb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = ddb.Table('Campaigns')

campaign_id = '1766597418206'

print(f"Checking campaign: {campaign_id}")
print("="*60)

# Get campaign
response = campaigns_table.get_item(Key={'campaignId': campaign_id})
campaign = response.get('Item')

if campaign:
    print("\n✅ Campaign found:")
    print(json.dumps(campaign, indent=2, default=str))
    
    # Check what's missing
    print("\n" + "="*60)
    print("VALIDATION:")
    
    subject = campaign.get('subject')
    body = campaign.get('body')
    
    if subject:
        print(f"✅ Subject: '{subject}'")
    else:
        print("❌ Subject: MISSING")
    
    if body:
        print(f"✅ Body: '{body[:100]}...'")
    else:
        print("❌ Body: MISSING")
        
    # Check if it's using old field names
    if 'bodyTemplate' in campaign:
        print(f"\n⚠️  Found 'bodyTemplate' instead of 'body': {campaign['bodyTemplate'][:100]}")
    
else:
    print("❌ Campaign not found")
