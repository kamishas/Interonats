import sys
import os
import base64
import boto3
import json

# Add correct lambda path
sys.path.insert(0, os.path.join(os.getcwd(), 'lambda-functions', 'ImageComplianceLambda'))

from lambda_function import check_image_with_claude

def main():
    print("Testing Bedrock Logic Locally...")
    image_path = r"C:\Users\kamin\Downloads\Interon\Emails Agent\Test data\1668198287318.jpg"
    
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return

    with open(image_path, "rb") as f:
        image_data = f.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')

    print(f"Image loaded. Size: {len(image_data)} bytes")

    try:
        print("Calling check_image_with_claude...")
        has_violations, violations, text = check_image_with_claude(image_base64)
        print("Success!")
        print(f"Violations: {violations}")
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
