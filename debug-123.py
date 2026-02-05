import boto3
import json

print("DEBUGGING S3 IMAGES for Campaign 123")
CAMPAIGN_ID = "1767627994756" 
BUCKET_NAME = "interon-email-images"
s3 = boto3.client('s3', region_name='us-east-2')

print(f"Checking S3 prefix: approved/{CAMPAIGN_ID}/")
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
