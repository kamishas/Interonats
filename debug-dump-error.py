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

print(f"DUMPING ERROR for Campaign: {CAMPAIGN_ID}")

try:
    response = recipients_table.query(
        KeyConditionExpression="campaignId = :cid",
        ExpressionAttributeValues={":cid": CAMPAIGN_ID}
    )
    
    recipients = response.get('Items', [])
    for r in recipients:
        if r.get('errorMessage'):
            with open('error_dump.txt', 'w', encoding='utf-8') as f:
                f.write(r.get('errorMessage'))
            print("Error saved to error_dump.txt")
            break
            
except Exception as e:
    print(f"Error: {str(e)}")
