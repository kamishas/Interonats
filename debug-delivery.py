import boto3
import json
from decimal import Decimal

# Helper to serialize DynamoDB items
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
recipients_table = dynamodb.Table('CampaignRecipients')
campaigns_table = dynamodb.Table('Campaigns')

CAMPAIGN_ID = '1767627369978'

print(f"DEBUGGING EMAIL DELIVERY for Campaign: {CAMPAIGN_ID}")
print("-" * 50)

# 1. Check Campaign Details (Images?)
camp = campaigns_table.get_item(Key={'campaignId': CAMPAIGN_ID}).get('Item')
if camp:
    print(f"Campaign Name: {camp.get('name')}")
    print(f"Status: {camp.get('status')}")
    print(f"Images Config: {len(camp.get('images', []))}")
else:
    print("❌ Campaign NOT FOUND")

# 2. Check Recipients
print("\nRecipients:")
try:
    response = recipients_table.query(
        KeyConditionExpression="campaignId = :cid",
        ExpressionAttributeValues={":cid": CAMPAIGN_ID}
    )
    
    recipients = response.get('Items', [])
    for r in recipients:
        print(f"\nExample Recipient:")
        print(f"  Email: {r.get('email')}")
        print(f"  Status: {r.get('status')}")
        print(f"  Zoho Message ID: {r.get('zohoMessageId', 'NONE')}")
        if r.get('errorMessage'):
            print(f"  ❌ Error Message: {r.get('errorMessage')}")
            
except Exception as e:
    print(f"Error querying recipients: {str(e)}")
