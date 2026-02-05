import json
import boto3
import base64

# Read the black image
with open(r'C:\Users\kamin\Downloads\Interon\Emails Agent\Test data\pure-black.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

# Test with Claude
bedrock = boto3.client('bedrock-runtime', region_name='us-east-2')

prompt = """Analyze this image. Extract any text you find.

Respond in JSON:
{
  "has_text": true/false,
  "text": "text found or empty string"
}"""

request = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 300,
    "temperature": 0,
    "messages": [{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data
                }
            },
            {
                "type": "text",
                "text": prompt
            }
        ]
    }]
}

response = bedrock.invoke_model(
    modelId='us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    body=json.dumps(request)
)

result = json.loads(response['body'].read())
print("Claude Response:")
print(result['content'][0]['text'])
