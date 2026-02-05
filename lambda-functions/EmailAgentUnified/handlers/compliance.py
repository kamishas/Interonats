import json
import boto3
import os

# Initialize Bedrock client
def check_text_compliance(event, context):
    try:
        # Initialize Bedrock client (Lazy load to prevent cold start crashes)
        bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-2')

        body = json.loads(event.get('body', '{}'))
        # Frontend sends 'body', backend expecting 'text'. Support both.
        text = body.get('text') or body.get('body', '')
        
        if not text:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Text is required'})}
            
        # Call Bedrock
        prompt = f"""
        You are an expert HR compliance officer. Analyze the following email text for any potential EEOC (Equal Employment Opportunity Commission) violations or bias.
        
        TEXT:
        "{text}"
        
        INSTRUCTIONS:
        1. Identify any discriminatory language or bias related to race, color, religion, sex, national origin, age, disability, or genetic information.
        2. If issues are found, list them clearly.
        3. If no issues are found, state "No compliance issues detected."
        4. Provide a suggestion for improvement if issues are found.
        
        RESPONSE FORMAT (JSON):
        {{
            "compliant": boolean,
            "issues": [list of strings],
            "suggestions": string
        }}
        """
        
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-3-5-haiku-20241022-v1:0', # Use Inference Profile for cross-region
            body=json.dumps(payload)
        )
        
        result_body = json.loads(response['body'].read())
        content = result_body['content'][0]['text']
        
        # Parse JSON from LLM response (handling potential markdown wrapping)
        json_str = content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0]
        elif "{" in content:
             start = content.find("{")
             end = content.rfind("}") + 1
             json_str = content[start:end]
             
        try:
            analysis = json.loads(json_str)
        except:
            # Fallback if LLM output isn't perfect JSON
            analysis = {
                "compliant": "No compliance issues" in content,
                "issues": [],
                "suggestions": content
            }
        
        # Transform to frontend expected format
        # Frontend expects: { isCompliant: bool, violations: [{ message: string }] }
        response_data = {
            "isCompliant": analysis.get("compliant", False),
            "violations": [{"message": issue} for issue in analysis.get("issues", [])],
            "suggestions": analysis.get("suggestions", "")
        }
            
        return {'statusCode': 200, 'body': json.dumps(response_data)}
        
    except Exception as e:
        print(f"Compliance Check Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
