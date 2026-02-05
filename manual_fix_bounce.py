import boto3
import time

def manual_fix():
    print("--- Manually Updating Recipient Status ---")
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table('CampaignRecipients')
    
    # Inspect Schema
    key_names = [k['AttributeName'] for k in table.key_schema]
    print(f"Key Schema: {key_names}")
    return
    campaign_id = item['campaignId']
    print(f"Found Item: Campaign={campaign_id}, Email={email}")
    
    # Inspect Schema
    key_names = [k['AttributeName'] for k in table.key_schema]
    print(f"Key Schema: {key_names}")
    
    # Construct Key
    key = {}
    for name in key_names:
        if name in item:
            key[name] = item[name]
        else:
            print(f"❌ Missing key attribute '{name}' in item.")
            return

    print(f"Using Key: {key}")
    
    # Update Item
    table.update_item(
        Key=key,
        UpdateExpression="set #s = :s, #e = :e, #f = :f",
        ExpressionAttributeNames={
            '#s': 'status',
            '#e': 'errorMessage',
            '#f': 'failedAt'
        },
        ExpressionAttributeValues={
            ':s': 'failed',
            ':e': '550 5.1.1 User unknown (Manually Verified)',
            ':f': str(int(time.time() * 1000)) 
        }
    )
    print("✅ Status updated to 'failed'.")
    
    # Update Stats
    stats_table = dynamodb.Table('CampaignStats')
    # Use update expression to increment failedCount
    try:
        stats_table.update_item(
            Key={'campaignId': campaign_id},
            UpdateExpression="ADD failedCount :inc",
            ExpressionAttributeValues={':inc': 1}
        )
        print("✅ Stats updated.")
    except Exception as e:
        print(f"Stats Error: {e}")

if __name__ == "__main__":
    manual_fix()
