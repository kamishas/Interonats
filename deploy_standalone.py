
import boto3
import json
import time
import zipfile
import os
import io

# Configuration
FUNCTION_NAME = "InteronGlobalAddressService"
ROLE_NAME = "InteronAddressLambdaRole"
POLICY_NAME = "InteronAddressLocationPolicy"
REGION = "us-east-1"
INDEX_NAME = "InteronAddressIndex"

# AWS Clients (using environment variables)
iam = boto3.client('iam', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def create_role():
    print(f"Checking IAM Role: {ROLE_NAME}...")
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }
    
    try:
        response = iam.get_role(RoleName=ROLE_NAME)
        role_arn = response['Role']['Arn']
        print(f"Role exists: {role_arn}")
    except iam.exceptions.NoSuchEntityException:
        print("Creating role...")
        response = iam.create_role(
            RoleName=ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        role_arn = response['Role']['Arn']
        print(f"Role created: {role_arn}")
        # Wait for propagation
        time.sleep(10) 

    # Attach Basic Execution Policy
    iam.attach_role_policy(
        RoleName=ROLE_NAME,
        PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    )

    # Attach Location Service Policy
    location_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "geo:SearchPlaceIndexForText",
            "Resource": f"arn:aws:geo:{REGION}:*:place-index/{INDEX_NAME}"
        }]
    }
    
    iam.put_role_policy(
        RoleName=ROLE_NAME,
        PolicyName=POLICY_NAME,
        PolicyDocument=json.dumps(location_policy)
    )
    print("Permissions attached.")
    return role_arn

def create_zip():
    print("Zipping deployment package...")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        # source file must be in lambda-functions/AddressVerificationLambda/lambda_function.py
        source_path = os.path.join("lambda-functions", "AddressVerificationLambda", "lambda_function.py")
        z.write(source_path, arcname="lambda_function.py")
    buf.seek(0)
    return buf.read()

def deploy_lambda(role_arn, zip_content):
    print(f"Deploying Lambda: {FUNCTION_NAME}...")
    
    # Check if exists
    try:
        lambda_client.get_function(FunctionName=FUNCTION_NAME)
        print("Function exists. Updating code and config...")
        lambda_client.update_function_code(
            FunctionName=FUNCTION_NAME,
            ZipFile=zip_content
        )
        # Wait for update
        time.sleep(2)
        lambda_client.update_function_configuration(
            FunctionName=FUNCTION_NAME,
            Environment={
                'Variables': {
                    'PLACE_INDEX_NAME': INDEX_NAME
                    # AWS_REGION is reserved and provided by runtime
                }
            },
            Role=role_arn
        )
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"Creating new function with Role: {role_arn} and Zip size: {len(zip_content)} bytes")
        # Need to wait a bit if role was just created
        time.sleep(10)
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

def enable_function_url():
    print("Configuring Function URL with CORS...")
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
        url = response['FunctionUrl']
    except lambda_client.exceptions.ResourceConflictException:
        response = lambda_client.get_function_url_config(FunctionName=FUNCTION_NAME)
        url = response['FunctionUrl']
        
        # Update CORS if needed
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
        
    # Ensure public permission
    try:
        lambda_client.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId='FunctionURLPublicAccess',
            Action='lambda:InvokeFunctionUrl',
            Principal='*',
            FunctionUrlAuthType='NONE'
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass

    print(f"\nSUCCESS! Function URL: {url}")
    return url

if __name__ == "__main__":
    try:
        role_arn = create_role()
        zip_content = create_zip()
        deploy_lambda(role_arn, zip_content)
        url = enable_function_url()
        
        # Save URL to file for next steps
        with open("deployed_url.txt", "w") as f:
            f.write(url)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Deployment Failed: {e}")
