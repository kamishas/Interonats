import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')

print("Listing last 10 campaigns...")
try:
    response = campaigns_table.scan(Limit=10)
    items = response.get('Items', [])
    
    for c in items:
        print(f"ID: {c.get('campaignId')}")
        print(f"Name: '{c.get('name')}'")
        print(f"Subject: '{c.get('subject')}'")
        print("-" * 20)

except Exception as e:
    print(f"Error: {str(e)}")
