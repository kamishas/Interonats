
import boto3

FUNCTION_NAME = "InteronGlobalAddressService"
REGION = "us-east-1"
lambda_client = boto3.client('lambda', region_name=REGION)

try:
    response = lambda_client.get_function_url_config(FunctionName=FUNCTION_NAME)
    print("URL:", response['FunctionUrl'])
except Exception as e:
    print(f"Error: {e}")
