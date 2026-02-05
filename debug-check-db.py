import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
recipients_table = dynamodb.Table('CampaignRecipients')
campaigns_table = dynamodb.Table('Campaigns')

def check_latest_campaign():
    # Target specific campaign
    cid = '1767890828220'
    print(f"Checking Campaign: {cid}")
    
    try:
        # Check Recipients
        r_resp = recipients_table.query(
            KeyConditionExpression='campaignId = :cid',
            ExpressionAttributeValues={':cid': cid}
        )
        recipients = r_resp.get('Items', [])
        print(f"\nRecipients Found: {len(recipients)}")
        for r in recipients:
            email = r.get('email', 'NoEmail')
            status = r.get('status', 'NoStatus')
            print(f" -> {email}: [{status}]")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_latest_campaign()
