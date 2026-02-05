import boto3
import json

def check_apigw():
    client = boto3.client('apigateway', region_name='us-east-2')
    try:
        resp = client.get_resources(restApiId='x0ntz3akmd')
        print("API Gateway Resources:")
        print(json.dumps(resp['items'], indent=2))
    except Exception as e:
        print(f"Error checking APIGW: {e}")

def get_params():
    client = boto3.client('lambda', region_name='us-east-2')
    try:
        resp = client.get_function(FunctionName='EmailAgentUnified')
        print("\nUnified Lambda ARN:")
        print(resp['Configuration']['FunctionArn'])
    except Exception as e:
         print(f"Error getting Lambda ARN: {e}")

if __name__ == '__main__':
    check_apigw()
    get_params()
