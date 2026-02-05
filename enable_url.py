
import boto3
import json
import sys

# Configuration
FUNCTION_NAME = "InteronGlobalAddressService"
REGION = "us-east-1"

lambda_client = boto3.client('lambda', region_name=REGION)

def enable_url():
    print(f"Enabling Function URL for {FUNCTION_NAME}...")
    try:
        response = lambda_client.create_function_url_config(
            FunctionName=FUNCTION_NAME,
            AuthType='NONE',
            Cors={
                'AllowOrigins': ['*'],
                'AllowMethods': ['POST', 'OPTIONS'],
                'AllowHeaders': ['Content-Type', 'Authorization'],
                'MaxAge': 86400
            }
        )
        print("Function URL Config Created.")
        return response['FunctionUrl']
    except lambda_client.exceptions.ResourceConflictException:
        print("Function URL Config already exists. Updating...")
        response = lambda_client.update_function_url_config(
            FunctionName=FUNCTION_NAME,
            AuthType='NONE',
            Cors={
                'AllowOrigins': ['*'],
                'AllowMethods': ['POST', 'OPTIONS'],
                'AllowHeaders': ['Content-Type', 'Authorization'],
                'MaxAge': 86400
            }
        )
        return response['FunctionUrl']
    except Exception as e:
        print(f"Error enabling URL: {e}")
        return None

def add_permission():
    print("Adding Public Permission...")
    try:
        lambda_client.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId='FunctionURLPublicAccess',
            Action='lambda:InvokeFunctionUrl',
            Principal='*',
            FunctionUrlAuthType='NONE'
        )
        print("Permission added.")
    except lambda_client.exceptions.ResourceConflictException:
        print("Permission already exists.")
    except Exception as e:
        print(f"Error adding permission: {e}")

if __name__ == "__main__":
    url = enable_url()
    if url:
        print(f"URL: {url}")
        add_permission()
        with open("deployed_url.txt", "w") as f:
            f.write(url)
    else:
        sys.exit(1)
