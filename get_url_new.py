
import boto3
FUNCTION_NAME = "InteronSimpleService"
REGION = "us-east-1"
lambda_client = boto3.client('lambda', region_name=REGION)
try:
    url = lambda_client.get_function_url_config(FunctionName=FUNCTION_NAME)['FunctionUrl']
    print(f"URL: {url}")
except: pass
