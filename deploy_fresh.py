
import boto3
import json
import time
import zipfile
import os
import io

# NEW Configuration
FUNCTION_NAME = "InteronAddressAPI"
ROLE_NAME = "InteronAddressAPIRole" # New role too
POLICY_NAME = "InteronAddressAPIPolicy"
REGION = "us-east-1"
INDEX_NAME = "InteronAddressIndex"

iam = boto3.client('iam', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def create_role():
    print(f"Creating Role {ROLE_NAME}...")
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }
    
    try:
        response = iam.create_role(
            RoleName=ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        role_arn = response['Role']['Arn']
        print(f"Role created: {role_arn}")
    except iam.exceptions.EntityAlreadyExistsException:
        print("Role exists.")
        role_arn = iam.get_role(RoleName=ROLE_NAME)['Role']['Arn']
        
    # Policies
    iam.attach_role_policy(
        RoleName=ROLE_NAME,
        PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    )
    
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
    time.sleep(10) # Wait for IAM propagation
    return role_arn

def create_zip():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        source_path = os.path.join("lambda-functions", "AddressVerificationLambda", "lambda_function.py")
        z.write(source_path, arcname="lambda_function.py")
    buf.seek(0)
    return buf.read()

def deploy():
    role_arn = create_role()
    zip_content = create_zip()
    
    print(f"Deploying {FUNCTION_NAME}...")
    # Delete if exists just in case
    try:
        lambda_client.delete_function(FunctionName=FUNCTION_NAME)
        print("Deleted old version.")
        time.sleep(5)
    except:
        pass

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
    print("Function created.")
    time.sleep(5)

    print("Creating Function URL (AuthType=NONE)...")
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
    print(f"URL: {url}")

    print("Adding Public Permission...")
    lambda_client.add_permission(
        FunctionName=FUNCTION_NAME,
        StatementId='PublicAccess',
        Action='lambda:InvokeFunctionUrl',
        Principal='*',
        FunctionUrlAuthType='NONE'
    )
    print("Permission added.")
    
    with open("final_url.txt", "w") as f:
        f.write(url)

if __name__ == "__main__":
    try:
        deploy()
    except Exception as e:
        import traceback
        traceback.print_exc()
