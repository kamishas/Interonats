import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('CampaignRecipients')

print("="*80)
print("CHECKING DYNAMODB CAMPAIGNRECIPIENTS TABLE")
print("="*80)

# Scan the table to see what's in it
response = table.scan(Limit=10)

items = response.get('Items', [])

print(f"\nTotal items in table: {response.get('Count', 0)}")

if items:
    print("\nItems in table:")
    for item in items:
        print(f"\n  Campaign ID: {item.get('campaignId')}")
        print(f"  Recipient ID: {item.get('recipientId')}")
        print(f"  Email: {item.get('email')}")
        print(f"  Name: {item.get('firstName')} {item.get('lastName')}")
else:
    print("\n❌ TABLE IS EMPTY!")
    print("This means recipients are NOT being saved to DynamoDB")
    print("\nPossible causes:")
    print("1. Lambda doesn't have write permissions to the table")
    print("2. Lambda code has an error when saving")
    print("3. POST request isn't actually calling the Lambda")

print(f"\n{'='*80}")
