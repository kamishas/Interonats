
import boto3
import json
import time
import zipfile
import os
import io

FUNCTION_NAME = "InteronSimpleService"
ROLE_NAME = "InteronSimpleRole"
REGION = "us-east-1"
INDEX_NAME = "InteronAddressIndex"

iam = boto3.client('iam', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def deploy():
    # Role
    try:
        iam.create_role(
            RoleName=ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
            })
        )
    except: pass
    iam.attach_role_policy(RoleName=ROLE_NAME, PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
    iam.put_role_policy(
        RoleName=ROLE_NAME, PolicyName="Loc",
        PolicyDocument=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Action": "geo:SearchPlaceIndexForText", "Resource": "*"}]
        })
    )
    time.sleep(10)
    role_arn = iam.get_role(RoleName=ROLE_NAME)['Role']['Arn']

    # Function
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join("lambda-functions", "AddressVerificationLambda", "lambda_function.py"), arcname="lambda_function.py")
    buf.seek(0)
    
    try: lambda_client.delete_function(FunctionName=FUNCTION_NAME)
    except: pass
    time.sleep(5)
    
    lambda_client.create_function(
        FunctionName=FUNCTION_NAME,
        Runtime='python3.12',
        Role=role_arn,
        Handler='lambda_function.lambda_handler',
        Code={'ZipFile': buf.read()},
        Environment={'Variables': {'PLACE_INDEX_NAME': INDEX_NAME}}
    )
    time.sleep(5)
    
    # URL
    res = lambda_client.create_function_url_config(FunctionName=FUNCTION_NAME, AuthType='NONE')
    url = res['FunctionUrl']
    print(f"URL: {url}")
    
    # Permission
    lambda_client.add_permission(
        FunctionName=FUNCTION_NAME,
        StatementId='PublicAccess',
        Action='lambda:InvokeFunctionUrl',
        Principal='*',
        FunctionUrlAuthType='NONE'
    )
    print("Permission Added.")
    
    with open("final_url_simple.txt", "w") as f:
        f.write(url)

if __name__ == "__main__":
    deploy()
