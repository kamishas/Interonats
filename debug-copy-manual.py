import boto3

BUCKET = "interon-email-images"
SOURCE_KEY = "approved/default/20260105_202318_pure-black.jpg"
DEST_KEY = "approved/1767644584353/20260105_202318_pure-black.jpg"

s3 = boto3.client('s3', region_name='us-east-2')

def test_copy():
    print(f"Attempting copy: {SOURCE_KEY} -> {DEST_KEY}")
    try:
        s3.copy_object(
            Bucket=BUCKET,
            CopySource={'Bucket': BUCKET, 'Key': SOURCE_KEY},
            Key=DEST_KEY
        )
        print("✅ Copy SUCCEEDED locally.")
    except Exception as e:
        print(f"❌ Copy FAILED locally: {e}")

if __name__ == "__main__":
    test_copy()
