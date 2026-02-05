
import boto3
import json
import time
import zipfile
import os
import io

# Configuration
FUNCTION_NAME = "InteronGlobalAddressService"
ROLE_NAME = "InteronAddressLambdaRole"
REGION = "us-east-1"
INDEX_NAME = "InteronAddressIndex"

lambda_client = boto3.client('lambda', region_name=REGION)
iam = boto3.client('iam', region_name=REGION)

def get_role_arn():
    try:
        response = iam.get_role(RoleName=ROLE_NAME)
        return response['Role']['Arn']
    except Exception as e:
        print(f"Error getting role: {e}")
        return None

def create_zip():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        source_path = os.path.join("lambda-functions", "AddressVerificationLambda", "lambda_function.py")
        z.write(source_path, arcname="lambda_function.py")
    buf.seek(0)
    return buf.read()

def clean_deploy():
    # 1. DELETE
    try:
        print(f"Deleting function {FUNCTION_NAME}...")
        lambda_client.delete_function(FunctionName=FUNCTION_NAME)
        print("Deleted.")
        time.sleep(5)
    except lambda_client.exceptions.ResourceNotFoundException:
        print("Function did not exist.")
    except Exception as e:
        print(f"Error deleting: {e}")

    # 2. CREATE
    role_arn = get_role_arn()
    zip_content = create_zip()
    
    print(f"Creating function with Role: {role_arn}...")
    try:
        lambda_client.create_function(
            FunctionName=FUNCTION_NAME,
            Runtime='python3.12',
            Role=role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_content},
            Environment={
                'Variables': {
                    'PLACE_INDEX_NAME': INDEX_NAME
                }
            },
            Timeout=10
        )
        print("Function Created.")
        time.sleep(5) # Wait for creation to propagate
    except Exception as e:
        print(f"Create Failed: {e}")
        return

    # 3. ENABLE URL (NO CORS FIRST to test)
    print("Enabling URL...")
    try:
        response = lambda_client.create_function_url_config(
            FunctionName=FUNCTION_NAME,
            AuthType='NONE'
            # Start simple
        )
        url = response['FunctionUrl']
        print(f"URL Created: {url}")
        
        # 4. UPDATE CORS
        print("Updating CORS...")
        lambda_client.update_function_url_config(
            FunctionName=FUNCTION_NAME,
            AuthType='NONE',
            Cors={
                'AllowOrigins': ['*'],
                'AllowMethods': ['POST', 'OPTIONS'],
                'AllowHeaders': ['Content-Type', 'Authorization'],
                'MaxAge': 86400
            }
        )
        print("CORS Updated.")
        
        # 5. PERMISSION
        lambda_client.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId='FunctionURLPublicAccess',
            Action='lambda:InvokeFunctionUrl',
            Principal='*',
            FunctionUrlAuthType='NONE'
        )
        print("Permission Added.")

        with open("deployed_url.txt", "w") as f:
            f.write(url)
            
    except Exception as e:
        print(f"URL Config Failed: {e}")

if __name__ == "__main__":
    clean_deploy()
