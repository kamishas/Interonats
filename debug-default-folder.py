import boto3

BUCKET_NAME = "interon-email-images"
s3 = boto3.client('s3', region_name='us-east-2')

print("Checking approved/default/ folder...")
try:
    resp = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix="approved/default/")
    if 'Contents' in resp:
        print(f"✅ Found {len(resp['Contents'])} files.")
        for obj in resp['Contents'][-5:]: # Last 5
            print(f" - {obj['Key']}")
    else:
        print("❌ 'approved/default/' is empty.")
except Exception as e:
    print(f"Error: {e}")
