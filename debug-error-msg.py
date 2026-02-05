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

CAMPAIGN_ID = '1767627994756'

print(f"DEBUGGING ERROR MSG for Campaign: {CAMPAIGN_ID}")

try:
    response = recipients_table.query(
        KeyConditionExpression="campaignId = :cid",
        ExpressionAttributeValues={":cid": CAMPAIGN_ID}
    )
    
    recipients = response.get('Items', [])
    for r in recipients:
        print(f"\nRecipient: {r.get('email')}")
        print(f"Status: {r.get('status')}")
        err = r.get('errorMessage')
        if err:
            print(f"❌ Error Message: {err}")
        else:
            print("No error message")
            
except Exception as e:
    print(f"Error querying recipients: {str(e)}")
