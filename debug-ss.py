import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')

print("Searching for subject 'ss'...")
try:
    response = campaigns_table.scan(
        FilterExpression="begins_with(subject, :s)",
        ExpressionAttributeValues={":s": "ss"}
    )
    
    items = response.get('Items', [])
    print(f"Found {len(items)} items")
    
    for c in items:
        print(f"ID: {c.get('campaignId')}")
        print(f"Status: {c.get('status')}")
        print(f"Subject: '{c.get('subject')}'")
        print(f"Body: '{c.get('body')}'")
        print(f"Template: '{c.get('bodyTemplate')}'")

except Exception as e:
    print(f"Error: {str(e)}")
