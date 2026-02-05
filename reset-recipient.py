import boto3

CAMPAIGN_ID = "1767644584353"
TABLE_NAME = "CampaignRecipients"

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table(TABLE_NAME)

def reset():
    print(f"Resetting recipients for {CAMPAIGN_ID}...")
    
    # 1. Get recipients
    resp = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key("campaignId").eq(CAMPAIGN_ID)
    )
    
    items = resp.get('Items', [])
    print(f"Found {len(items)} recipients.")
    
    # 2. Update status to pending
    for item in items:
        rid = item['recipientId']
        print(f"Resetting {rid} ({item.get('email')})...")
        
        table.update_item(
            Key={'campaignId': CAMPAIGN_ID, 'recipientId': rid},
            UpdateExpression="SET #st = :s",
            ExpressionAttributeNames={'#st': 'status'},
            ExpressionAttributeValues={':s': 'pending'}
        )
        
    print("✅ Reset Complete.")

if __name__ == "__main__":
    reset()
