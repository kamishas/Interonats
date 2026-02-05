import boto3
import json

def check_env():
    client = boto3.client('lambda', region_name='us-east-2')
    try:
        response = client.get_function_configuration(FunctionName='onehr-login-api')
        env_vars = response.get('Environment', {}).get('Variables', {})
        print(json.dumps(env_vars, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_env()
