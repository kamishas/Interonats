import boto3
import os

BUCKET_NAME = "interon-email-images"
CAMPAIGN_ID = "1767636953859" # ss123
IMAGE_NAME = "pure-black.jpg"
TABLE_NAME = "Campaigns"

s3 = boto3.client('s3', region_name='us-east-2')
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table(TABLE_NAME)

def recover():
    # 1. Search for image in approved/default/
    print(f"Searching for *{IMAGE_NAME} in approved/default/...")
    resp = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix="approved/default/")
    
    found_key = None
    if 'Contents' in resp:
        for obj in resp['Contents']:
            if obj['Key'].endswith(IMAGE_NAME):
                found_key = obj['Key']
                break
    
    if not found_key:
        print("❌ Image not found in default library.")
        return

    print(f"✅ Found source: {found_key}")
    
    # 2. Copy to campaign folder
    dest_key = f"approved/{CAMPAIGN_ID}/{IMAGE_NAME}"
    print(f"Copying to {dest_key}...")
    
    s3.copy_object(
        Bucket=BUCKET_NAME,
        CopySource={'Bucket': BUCKET_NAME, 'Key': found_key},
        Key=dest_key
    )
    
    # 3. Update DynamoDB
    url = f"https://{BUCKET_NAME}.s3.us-east-2.amazonaws.com/{dest_key}"
    print(f"Updating DynamoDB for campaign {CAMPAIGN_ID}...")
    
    # Construct image object
    image_obj = {
        'filename': IMAGE_NAME,
        'key': dest_key,
        'url': url,
        'isCompliant': True
    }
    
    table.update_item(
        Key={'campaignId': CAMPAIGN_ID},
        UpdateExpression="SET images = :i",
        ExpressionAttributeValues={':i': [image_obj]}
    )
    
    print("✅ RECOVERY COMPLETE. You can now Send.")

if __name__ == "__main__":
    recover()
