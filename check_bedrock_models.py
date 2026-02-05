import boto3
import json

def list_models():
    try:
        bedrock = boto3.client(service_name='bedrock', region_name='us-east-2')
        response = bedrock.list_foundation_models()
        
        print(f"Finding enabled Anthropic models in us-east-2...")
        for model in response['modelSummaries']:
            if 'anthropic' in model['modelId']:
                 print(f"- {model['modelId']} ({model['modelName']}) - Status: {model['modelLifecycle']['status']}")
                 
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
