import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')

print("Searching for 'ss'...")
try:
    response = campaigns_table.scan(
        FilterExpression="begins_with(#n, :name)",
        ExpressionAttributeNames={"#n": "name"},
        ExpressionAttributeValues={":name": "ss"}
    )
    
    items = response.get('Items', [])
    if not items:
        print("NO CAMPAIGN FOUND")
    else:
        c = items[0]
        print(f"ID: {c.get('campaignId')}")
        print(f"Name: {c.get('name')}")
        print(f"Status: {c.get('status')}")
        print(f"Subject: '{c.get('subject')}'")
        print(f"Body: '{c.get('body')}'")
        print(f"Template: '{c.get('bodyTemplate')}'")

except Exception as e:
    print(f"Error: {str(e)}")
