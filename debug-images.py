import boto3
import json

print("="*80)
print("DEBUGGING IMAGE ATTACHMENTS for 'ss'")
print("="*80)

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')
s3 = boto3.client('s3', region_name='us-east-2')
BUCKET_NAME = "interon-email-images"

# 1. Find Campaign (Hardcoded ID from discovery)
CAMPAIGN_ID = "1767582473521" 

print(f"Checking Campaign: {CAMPAIGN_ID}")
camp_item = campaigns_table.get_item(Key={'campaignId': CAMPAIGN_ID}).get('Item')

if not camp_item:
    print("❌ Campaign not found in DynamoDB")
    exit()

images = camp_item.get('images', [])
print(f"DynamoDB 'images' attribute: {json.dumps(images, default=str)}")

# 2. Check S3 'approved' folder
print(f"\nChecking S3 prefix: approved/{CAMPAIGN_ID}/")
try:
    resp = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f"approved/{CAMPAIGN_ID}/")
    if 'Contents' in resp:
        print(f"✅ Found {len(resp['Contents'])} files:")
        for obj in resp['Contents']:
            print(f"   - {obj['Key']} (Size: {obj['Size']})")
    else:
        print("❌ No files found in 'approved/' folder.")
except Exception as e:
    print(f"Error listing S3: {str(e)}")

# 3. Check S3 'temp' folder (just in case)
print(f"\nChecking S3 prefix: temp/")
try:
    resp = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f"temp/")
    # Just list a few to see if our files are there
    if 'Contents' in resp:
        print(f"ℹ️  Temp folder has {len(resp['Contents'])} files. (Showing last 5)")
        sorted_objs = sorted(resp['Contents'], key=lambda x: x['LastModified'], reverse=True)[:5]
        for obj in sorted_objs:
             print(f"   - {obj['Key']} ({obj['LastModified']})")
except Exception as e:
    print(f"Error listing S3: {str(e)}")
