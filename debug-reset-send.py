import boto3
import json
import base64
import sys

sys.stdout.reconfigure(encoding='utf-8')

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
recipients_table = dynamodb.Table('CampaignRecipients')
campaigns_table = dynamodb.Table('Campaigns')
lambda_client = boto3.client('lambda', region_name='us-east-2')

CAMPAIGN_ID = '1767627994756'
RECIPIENT_ID = '1767554378135' # Need to find the actual ID. Query first.

print(f"DEBUGGING {CAMPAIGN_ID}...")

# 1. GET RECIPIENT ID
resp = recipients_table.query(
    KeyConditionExpression="campaignId = :cid",
    ExpressionAttributeValues={":cid": CAMPAIGN_ID}
)
items = resp.get('Items', [])
if not items:
    print("No items found")
    exit()

r = items[0]
recipient_id = r['recipientId']
print(f"Resetting Recipient: {r['email']} ({recipient_id})")

# 2. RESET STATUS
recipients_table.update_item(
    Key={'campaignId': CAMPAIGN_ID, 'recipientId': recipient_id},
    UpdateExpression="SET #s = :p, zohoMessageId = :n",
    ExpressionAttributeNames={'#s': 'status'},
    ExpressionAttributeValues={':p': 'pending', ':n': ''}
)
print("✅ Status reset to pending")

# 3. INVOKE LAMBDA (No Logs)
event = {
    "pathParameters": {
        "campaignId": CAMPAIGN_ID
    },
    "requestContext": {
        "http": {
            "method": "POST"
        }
    }
}

print("Invoking Lambda...")
response = lambda_client.invoke(
    FunctionName='SendCampaignLambda',
    InvocationType='RequestResponse',
    LogType='None', # Disable logs to save space
    Payload=json.dumps(event)
)

# logs = base64.b64decode(response['LogResult']).decode('utf-8')
# print(logs)

payload_str = response['Payload'].read().decode('utf-8')
print("\n--- RESPONSE PAYLOAD ---")
try:
    payload_json = json.loads(payload_str)
    # API Gateway response structure: { statusCode: ..., body: "..." }
    body = json.loads(payload_json['body'])
    
    if 'debug' in body:
        print("\n--- ZOHO DEBUG INFO ---")
        print(json.dumps(body['debug'], indent=2, default=str))
    else:
        print("No debug info found in body")
        print(payload_str[:500]) # Print start if no debug

except Exception as e:
    print(f"Error parsing response: {e}")
    print(payload_str)
