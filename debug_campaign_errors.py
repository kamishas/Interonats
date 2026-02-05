import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('CampaignRecipients')

def find_latest_error():
    # Scan for failed items
    response = table.scan(
        FilterExpression=Attr('status').eq('failed')
    )
    
    items = response.get('Items', [])
    if not items:
        print("No failed recipients found.")
        return

    # Sort by 'updatedAt' or 'sentAt' (if available) - usually we just want to see *any* error
    # We'll just print the last 5
    print(f"Found {len(items)} failed recipients. Showing last 5:")
    
    for item in items[-5:]:
        print(f"--- Recipient: {item.get('email')} ---")
        print(f"Campaign ID: {item.get('campaignId')}")
        print(f"Error Message: {item.get('errorMessage')}")
        print("------------------------------------------")

if __name__ == "__main__":
    find_latest_error()
