import boto3

def clear_tables():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    campaigns_table = dynamodb.Table('Campaigns')
    recipients_table = dynamodb.Table('CampaignRecipients')
    
    print("WARNING: About to delete all data from Campaigns and CampaignRecipients.")
    
    # 1. Clear Campaigns
    print("Scanning Campaigns...")
    scan = campaigns_table.scan()
    with campaigns_table.batch_writer() as batch:
        count = 0
        for each in scan.get('Items', []):
            batch.delete_item(Key={'campaignId': each['campaignId']})
            count += 1
        print(f"Deleted {count} campaigns.")
        
    # 2. Clear Recipients
    print("Scanning Recipients...")
    scan = recipients_table.scan()
    with recipients_table.batch_writer() as batch:
        count = 0
        for each in scan.get('Items', []):
            # Key schema for Recipients is campaignId (PK) and recipientId (SK)
            batch.delete_item(Key={
                'campaignId': each['campaignId'], 
                'recipientId': each['recipientId']
            })
            count += 1
        print(f"Deleted {count} recipients.")
        
    print("✅ System cleared successfully.")

if __name__ == "__main__":
    clear_tables()
