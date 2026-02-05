import boto3

BUCKET = "interon-email-images"
CAMPAIGN_ID = "1767644584353"
DEFAULT_PREFIX = "approved/default/"
CAMPAIGN_PREFIX = f"approved/{CAMPAIGN_ID}/"

s3 = boto3.client('s3', region_name='us-east-2')

def check():
    print(f"--- Checking {DEFAULT_PREFIX} ---")
    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=DEFAULT_PREFIX)
    if 'Contents' in resp:
        for obj in resp['Contents']:
            if 'pure-black' in obj['Key']:
                print(f"FOUND in DEFAULT: {obj['Key']}")

    print(f"\n--- Checking {CAMPAIGN_PREFIX} ---")
    resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=CAMPAIGN_PREFIX)
    if 'Contents' in resp:
        for obj in resp['Contents']:
            print(f"FOUND in CAMPAIGN: {obj['Key']}")
    else:
        print("EMPTY (No objects found)")

if __name__ == "__main__":
    check()
