import boto3
import json
import time

# Configuration
REGION = 'us-east-2'
API_NAME = 'EmailAgentAPI'
LAMBDA_FUNCTION_NAME = 'AddressVerificationLambda'
LAMBDA_ROLE_ARN = 'arn:aws:iam::397753625517:role/ContactManagerRole' # Using existing role
ZIP_FILE_PATH = 'lambda_function.zip'
HANDLER = 'lambda_function.lambda_handler'
RUNTIME = 'python3.9'

lambda_client = boto3.client('lambda', region_name=REGION)
apigateway = boto3.client('apigateway', region_name=REGION)

def create_zip():
    import zipfile
    import os
    
    print(f"Creating {ZIP_FILE_PATH}...")
    source_dir = f"lambda-functions/{LAMBDA_FUNCTION_NAME}"
    with zipfile.ZipFile(ZIP_FILE_PATH, 'w') as z:
        for root, _, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                z.write(file_path, arcname)
    print("Zip created.")

def deploy_lambda():
    print(f"Deploying Lambda: {LAMBDA_FUNCTION_NAME}")
    
    with open(ZIP_FILE_PATH, 'rb') as f:
        zipped_code = f.read()
    
    try:
        lambda_client.get_function(FunctionName=LAMBDA_FUNCTION_NAME)
        print("Function exists. Updating code...")
        lambda_client.update_function_code(
            FunctionName=LAMBDA_FUNCTION_NAME,
            ZipFile=zipped_code
        )
        print("Waiting for code update to settle...")
        time.sleep(10) 
        # Update Config (Env Vars)
        lambda_client.update_function_configuration(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Environment={
                'Variables': {
                    'USPS_CLIENT_KEY': 'dCeWPspWze4SR3iXtOf7KlW9FkgLGFYBT8k16NHDaEnMKqUC',
                    'USPS_CLIENT_SECRET': '0PURhG9uYo9YM7bBhZTkcvzSRvqkmwlGeAmz1KOK0knG4yARSYGmWmUIASXxpTHx'
                }
            }
        )
        print("Waiting for update...")
        time.sleep(5)
    except lambda_client.exceptions.ResourceNotFoundException:
        print("Function does not exist. Creating...")
        lambda_client.create_function(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Runtime=RUNTIME,
            Role=LAMBDA_ROLE_ARN,
            Handler=HANDLER,
            Code={'ZipFile': zipped_code},
            Environment={
                'Variables': {
                    'USPS_CLIENT_KEY': 'dCeWPspWze4SR3iXtOf7KlW9FkgLGFYBT8k16NHDaEnMKqUC',
                    'USPS_CLIENT_SECRET': '0PURhG9uYo9YM7bBhZTkcvzSRvqkmwlGeAmz1KOK0knG4yARSYGmWmUIASXxpTHx'
                }
            },
            Timeout=15
        )
        print("Function created.")

def setup_api_gateway():
    print(f"Configuring API Gateway for {API_NAME}...")
    
    # Get API ID
    apis = apigateway.get_rest_apis()
    api_id = next((item['id'] for item in apis['items'] if item['name'] == API_NAME), None)
    
    if not api_id:
        print(f"API {API_NAME} not found!")
        return
    
    print(f"Found API ID: {api_id}")
    
    # Get Root Resource
    resources = apigateway.get_resources(restApiId=api_id)
    root_id = next(item['id'] for item in resources['items'] if item['path'] == '/')
    
    # Create /util resource if not exists
    util_id = next((item['id'] for item in resources['items'] if item.get('pathPart') == 'util'), None)
    if not util_id:
        print("Creating /util resource...")
        util_res = apigateway.create_resource(restApiId=api_id, parentId=root_id, pathPart='util')
        util_id = util_res['id']
    else:
        print("Found /util resource.")

    # Create /util/verify-address resource
    verify_id = next((item['id'] for item in resources['items'] if item.get('pathPart') == 'verify-address' and item.get('parentId') == util_id), None)
    if not verify_id:
        print("Creating /util/verify-address resource...")
        verify_res = apigateway.create_resource(restApiId=api_id, parentId=util_id, pathPart='verify-address')
        verify_id = verify_res['id']
    else:
        print("Found /util/verify-address resource.")
        
    # Setup POST method
    setup_method(api_id, verify_id, 'POST')
    
    # Setup OPTIONS method for CORS
    setup_cors(api_id, verify_id)
    
    # Deploy API
    print("Deploying API...")
    apigateway.create_deployment(restApiId=api_id, stageName='prod')
    print("API Deployed to 'prod' stage.")

def setup_method(api_id, resource_id, method):
    try:
        apigateway.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod=method,
            authorizationType='NONE'
        )
    except apigateway.exceptions.ConflictException:
        pass # Method exists
        
    # Integration
    lambda_uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:{REGION}:397753625517:function:{LAMBDA_FUNCTION_NAME}/invocations"
    
    apigateway.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod=method,
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=lambda_uri
    )
    
    # Add Permission to Lambda
    try:
        lambda_client.add_permission(
            FunctionName=LAMBDA_FUNCTION_NAME,
            StatementId=f'apigateway-check-address-{int(time.time())}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:397753625517:{api_id}/*/*/*"
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass # Permission exists

def setup_cors(api_id, resource_id):
    method = 'OPTIONS'
    try:
        apigateway.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod=method,
            authorizationType='NONE'
        )
    except apigateway.exceptions.ConflictException:
        pass

    # Mock Integration for OPTIONS
    apigateway.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod=method,
        type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )
    
    apigateway.put_method_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod=method,
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': True,
            'method.response.header.Access-Control-Allow-Methods': True,
            'method.response.header.Access-Control-Allow-Origin': True
        }
    )
    
    apigateway.put_integration_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod=method,
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
        },
        responseTemplates={'application/json': ''}
    )

if __name__ == '__main__':
    create_zip()
    deploy_lambda()
    setup_api_gateway()
