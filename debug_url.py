
import boto3
import json

FUNCTION_NAME = "InteronGlobalAddressService"
REGION = "us-east-1"
lambda_client = boto3.client('lambda', region_name=REGION)

with open("url_debug.txt", "w") as f:
    try:
        # Get URL Config
        response = lambda_client.get_function_url_config(FunctionName=FUNCTION_NAME)
        url = response['FunctionUrl']
        auth_type = response['AuthType']
        f.write(f"URL: {url}\n")
        f.write(f"AuthType: {auth_type}\n")
        
        # Get Policy
        try:
            policy_response = lambda_client.get_policy(FunctionName=FUNCTION_NAME)
            policy = json.loads(policy_response['Policy'])
            f.write(f"Policy: {json.dumps(policy, indent=2)}\n")
        except lambda_client.exceptions.ResourceNotFoundException:
            f.write("Policy: None (ResourceNotFound)\n")
            
    except Exception as e:
        f.write(f"Error: {e}\n")
