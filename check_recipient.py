import boto3

def check_recipient(email=None):
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table('CampaignRecipients')
    
    print(f"Scanning Table...")
    response = table.scan()
    
    items = response.get('Items', [])
    print(f"Total Items: {len(items)}")
    for item in items:
        print(f" - [{item.get('status')}] {item.get('email')} (CampID: {item.get('campaignId')}) Error: {item.get('errorMessage')}")

if __name__ == "__main__":
    check_recipient('jgarcia@nexustech.com')
