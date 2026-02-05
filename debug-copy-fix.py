import boto3
import urllib.parse
import os

CAMPAIGN_ID = "1767627994756" 
BUCKET_NAME = "interon-email-images"
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')
s3 = boto3.client('s3', region_name='us-east-2')

print(f"FIXING IMAGES for Campaign {CAMPAIGN_ID}")
camp_resp = campaigns_table.get_item(Key={'campaignId': CAMPAIGN_ID})
camp = camp_resp.get('Item')

if not camp:
    print("Campaign not found")
    exit()

images = camp.get('images', [])
updated_images = []
changed = False

for img in images:
    url = img.get('url', '')
    print(f"Processing: {url}")
    
    if 'amazonaws.com' in url:
        parsed = urllib.parse.urlparse(url)
        source_key = parsed.path.lstrip('/')
    else:
        source_key = url
    
    filename = os.path.basename(source_key)
    dest_key = f"approved/{CAMPAIGN_ID}/{filename}"
    
    if source_key != dest_key:
        print(f"Copying {source_key} -> {dest_key}")
        try:
            s3.copy_object(
                Bucket=BUCKET_NAME,
                CopySource={'Bucket': BUCKET_NAME, 'Key': source_key},
                Key=dest_key
            )
            print("✅ Copy Success")
            
            img['url'] = f"https://{BUCKET_NAME}.s3.us-east-2.amazonaws.com/{dest_key}"
            img['key'] = dest_key
            updated_images.append(img)
            changed = True
        except Exception as e:
            print(f"❌ Copy Failed: {e}")
            updated_images.append(img)
    else:
        print("Already in correct location")
        updated_images.append(img)

if changed:
    print("Updating DynamoDB...")
    campaigns_table.update_item(
        Key={'campaignId': CAMPAIGN_ID},
        UpdateExpression="SET images = :i",
        ExpressionAttributeValues={':i': updated_images}
    )
    print("✅ DynamoDB Updated")
else:
    print("No changes needed")
