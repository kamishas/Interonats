import json
import boto3
import base64
import re

# Initialize Bedrock client for us-east-2 (Ohio)
bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-2')

# Visa-related keywords to check
VISA_KEYWORDS = [
    'h1b', 'h-1b', 'opt', 'cpt', 'green card', 'gc', 'citizenship', 'citizen',
    'visa', 'work authorization', 'immigration', 'ead', 'uscis', 'h4', 'h-4',
    'l1', 'l-1', 'l2', 'work permit', 'bench', 'bench sales', 'bench recruiting'
]

def check_image_with_claude(image_base64):
    """
    Use Claude 3.5 Sonnet vision API to analyze image for EEOC compliance
    Returns: (has_violations, violations_list, extracted_text)
    """
    
    # Remove data URL prefix if present
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    # Compliance checking prompt
    prompt = """Analyze this image for EEOC compliance violations. Look for ANY text or content related to:

1. Visa status (H1B, OPT, CPT, GC, Green Card, citizenship, work authorization, EAD, USCIS, H4, L1, L2)
2. Bench sales or bench recruiting terminology
3. Discriminatory language about immigration status

Extract ALL text from the image and identify ANY visa-related or discriminatory content.

Respond ONLY in this JSON format:
{
  "has_violations": true/false,
  "extracted_text": "all text found in image",
  "violations": [
    {
      "type": "VISA_RESTRICTION",
      "text": "exact text found",
      "severity": "CRITICAL",
      "message": "description"
    }
  ]
}

Be thorough - flag ANYTHING related to visa status or work authorization."""

    try:
        # Prepare request for Claude 3.5 Sonnet with vision
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "temperature": 0.1,  # Low temperature for fast, consistent results
            "top_k": 10,
            "top_p": 0.9,
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
        
        # Invoke Claude 3.5 Sonnet (v1 - widely available)
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20240620-v1:0',
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        ai_response = response_body['content'][0]['text']
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if json_match:
            result = json.loads(json_match.group())
            return result.get('has_violations', False), result.get('violations', []), result.get('extracted_text', '')
        
        # Fallback: check for keywords in response
        response_lower = ai_response.lower()
        found_violations = []
        for keyword in VISA_KEYWORDS:
            if keyword in response_lower:
                found_violations.append({
                    'type': 'VISA_RESTRICTION',
                    'text': keyword,
                    'severity': 'CRITICAL',
                    'message': f'Visa-related content detected: "{keyword}"'
                })
        
        return len(found_violations) > 0, found_violations, ai_response
        
    except Exception as e:
        print(f"Bedrock error: {str(e)}")
        raise

def lambda_handler(event, context):
    """
    Check image compliance using Claude Bedrock vision API
    Expects base64 encoded image in request body
    """
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': ''
            }
        
        # Parse request
        body = json.loads(event.get('body', '{}'))
        image_data = body.get('image')  # base64 encoded
        
        if not image_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No image data provided'})
            }
        
        # Check compliance with Claude vision
        has_violations, violations, extracted_text = check_image_with_claude(image_data)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'isCompliant': not has_violations,
                'violations': violations,
                'extractedText': extracted_text,
                'summary': {
                    'total': len(violations),
                    'critical': len([v for v in violations if v.get('severity') == 'CRITICAL'])
                }
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
