import json
import boto3
import os

# Initialize Bedrock client
bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-2')

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        intent = body.get('intent', '')
        tone = body.get('tone', 'Professional')
        count = body.get('count', 3)
        
        if not intent:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps({'error': 'Intent is required'})
            }

        # Construct the prompt for Claude 3
        prompt = f"""You are an expert email copywriter. 
        
        Task: Generate {count} distinct email variations based on the following user intent and tone.
        
        User Intent: "{intent}"
        Tone: {tone}
        
        Requirements:
        1. Each variation should have a unique Subject Line and Body.
        2. The Body should use placeholders like {{firstName}}, {{lastName}}, {{company}} where appropriate.
        3. The content should be high-quality, professional, and directly address the user's intent.
        4. Output MUST be a valid JSON array of objects. Each object must have "subject" and "body" keys.
        5. Do not include any introductory text or markdown formatting outside the JSON. Just the JSON array.
        
        Example Output Format:
        [
            {{
                "subject": "Subject 1",
                "body": "Body 1..."
            }},
            {{
                "subject": "Subject 2",
                "body": "Body 2..."
            }}
        ]
        """

        # Prepare the payload for Claude 3
        # Using Claude 3.5 Sonnet (Cross-region inference profile)
        model_id = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"
        
        native_request = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "temperature": 0.7,
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}]
                }
            ]
        }

        request = json.dumps(native_request)

        # Invoke Bedrock
        response = bedrock.invoke_model(modelId=model_id, body=request)
        
        # Parse response
        model_response = json.loads(response["body"].read())
        response_text = model_response["content"][0]["text"]
        
        # Extract JSON from response (in case there's extra text)
        try:
            # Try to find the JSON array in the text
            start_index = response_text.find('[')
            end_index = response_text.rfind(']') + 1
            if start_index != -1 and end_index != -1:
                json_str = response_text[start_index:end_index]
                variations = json.loads(json_str)
            else:
                # Fallback if regex fails, though Claude is usually good
                variations = json.loads(response_text)
        except json.JSONDecodeError:
            print(f"Failed to parse JSON from model output: {response_text}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps({'error': 'Failed to generate valid JSON response from AI'})
            }

        # Add IDs to variations
        for i, v in enumerate(variations):
            v['id'] = f"variant-{i+1}"

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({'variations': variations})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({'error': str(e)})
        }
