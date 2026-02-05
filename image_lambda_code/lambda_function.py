import json
import boto3
import base64
import uuid
from datetime import datetime

# Initialize AWS clients
s3 = boto3.client('s3', region_name='us-east-2')
bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-2')

BUCKET_NAME = 'interon-email-images'

# Visa-related keywords to check
VISA_KEYWORDS = [
    'h1b', 'h-1b', 'h1-b', 'opt', 'cpt', 'green card', 'greencard', 'gc', 'citizenship', 'citizen',
    'visa', 'work authorization', 'work auth', 'immigration', 'ead', 'uscis', 'h4', 'h-4',
    'l1', 'l-1', 'l2', 'work permit', 'bench', 'f1', 'f-1', 'stem opt', 'stem-opt'
]

def check_image_with_claude(image_base64):
    """
    Simple compliance check using Claude Vision:
    1. Ask Claude to extract ALL text from image
    2. Check extracted text for visa keywords
    """
    
    # Remove data URL prefix if present
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    # Simple prompt: just extract all text
    prompt = "Extract ALL text you see in this image. Return only the text, nothing else."
    
    try:
        # Claude Vision request
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "temperature": 0,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        print("=== INVOKING CLAUDE VISION ===")
        
        # Invoke Claude
        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        extracted_text = response_body['content'][0]['text'].strip()
        
        print(f"=== EXTRACTED TEXT ===")
        print(f"Length: {len(extracted_text)}")
        print(f"Preview: {extracted_text[:300]}")
        
        # If no text extracted, image is compliant
        if not extracted_text or len(extracted_text) < 3:
            print("No text found - image is compliant")
            return False, [], "No text detected"
        
        # Convert to lowercase for case-insensitive matching
        text_lower = extracted_text.lower()
        
        # Check for visa keywords
        violations = []
        for keyword in VISA_KEYWORDS:
            if keyword in text_lower:
                violations.append({
                    'type': 'VISA_RESTRICTION',
                    'text': keyword.upper(),
                    'severity': 'CRITICAL',
                    'description': f'Visa-related keyword detected: "{keyword}"'
                })
                print(f"✓ VIOLATION: Found '{keyword}'")
        
        has_violations = len(violations) > 0
        
        print(f"=== COMPLIANCE CHECK RESULT ===")
        print(f"Violations found: {len(violations)}")
        if violations:
            print(f"Keywords: {[v['text'] for v in violations]}")
        
        return has_violations, violations, extracted_text
        
    except Exception as e:
        print(f"Bedrock error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

def lambda_handler(event, context):
    """
    Check image compliance and upload to S3
    """
    origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin') or '*'

    try:
        # Handle CORS preflight
        if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps({'message': 'CORS preflight'})
            }
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')
        campaign_id = body.get('campaignId', 'default')
        filename = body.get('filename', f'image-{uuid.uuid4()}.jpg')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No image provided'})
            }
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        
        # Upload to temp folder
        temp_key = f"temp/{campaign_id}/{unique_filename}"
        
        # Decode base64
        if ',' in image_base64:
            image_base64_clean = image_base64.split(',')[1]
        else:
            image_base64_clean = image_base64
            
        image_data = base64.b64decode(image_base64_clean)
        
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=temp_key,
            Body=image_data,
            ContentType='image/jpeg'
        )
        
        print(f"Uploaded to temp: {temp_key}")
        
        # Check compliance with Claude
        has_violations, violations, extracted_text = check_image_with_claude(image_base64_clean)
        
        # Handle result
        if has_violations:
            # Delete non-compliant image
            s3.delete_object(Bucket=BUCKET_NAME, Key=temp_key)
            print(f"Deleted non-compliant image: {temp_key}")
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'isCompliant': False,
                    'violations': violations,
                    'extractedText': extracted_text,
                    'message': 'Image contains EEOC violations'
                })
            }
        else:
            # Move to approved folder
            approved_key = f"approved/{campaign_id}/{unique_filename}"
            s3.copy_object(
                Bucket=BUCKET_NAME,
                CopySource={'Bucket': BUCKET_NAME, 'Key': temp_key},
                Key=approved_key
            )
            s3.delete_object(Bucket=BUCKET_NAME, Key=temp_key)
            
            print(f"Moved to approved: {approved_key}")
            
            # Generate URL
            url = f"https://{BUCKET_NAME}.s3.us-east-2.amazonaws.com/{approved_key}"
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'isCompliant': True,
                    'url': url,
                    'violations': [],
                    'extractedText': extracted_text,
                    'message': 'Image is compliant'
                })
            }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
