import boto3
import json

CAMPAIGN_ID = "1767627994756" 
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')

print(f"Checking Campaign: {CAMPAIGN_ID}")
camp_item = campaigns_table.get_item(Key={'campaignId': CAMPAIGN_ID}).get('Item')

if camp_item:
    images = camp_item.get('images', [])
    print(f"Images count: {len(images)}")
    for img in images:
        print(json.dumps(img, indent=2))
else:
    print("Campaign not found")
