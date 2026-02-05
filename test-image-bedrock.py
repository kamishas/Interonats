#!/usr/bin/env python3
"""
Test Image Compliance with Claude Bedrock Vision API
"""
import json
import base64
import sys
import os

# Add lambda function to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lambda-functions', 'ImageUploadLambda'))

from lambda_function import check_image_with_claude

def main():
    image_path = r"C:\Users\kamin\Downloads\Interon\Emails Agent\Test data\1668198287318.jpg"
    
    print("=" * 70)
    print("🔍 Image Compliance Checker - Claude Bedrock Vision API")
    print("=" * 70)
    print(f"Image: {image_path}")
    print(f"Model: Claude 3.5 Sonnet (us-east-2)")
    print(f"Temperature: 0.1 (fast & accurate)")
    print()
    
    # Read and encode image
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    print("📤 Sending image to Claude Bedrock...")
    print()
    
    try:
        # Check compliance
        has_violations, violations, extracted_text = check_image_with_claude(image_base64)
        
        print("📄 Extracted Text:")
        print("-" * 70)
        print(extracted_text[:500] if len(extracted_text) > 500 else extracted_text)
        if len(extracted_text) > 500:
            print("... (truncated)")
        print("-" * 70)
        print()
        
        print("🛡️  Compliance Check Results:")
        print("-" * 70)
        
        if not has_violations:
            print("✅ Image is COMPLIANT - No EEOC violations detected")
        else:
            print(f"❌ Image has {len(violations)} VIOLATION(S):")
            print()
            for i, v in enumerate(violations, 1):
                severity = v.get('severity', 'HIGH')
                vtype = v.get('type', 'UNKNOWN')
                text = v.get('text', '')
                message = v.get('message', f'Found: "{text}"')
                print(f"  {i}. [{severity}] {vtype}")
                print(f"     {message}")
                print()
        
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
        print("Make sure AWS credentials are configured:")
        print("  aws configure")
        print()
        print("And Bedrock access is enabled in us-east-2")
        print("=" * 70)

if __name__ == '__main__':
    main()
