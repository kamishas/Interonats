import boto3
import time

client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')
api_id = '5cs5faz106'
region = 'us-east-2'
account_id = '397753625517'
function_name = 'ZohoAuthLambda'
lambda_arn = f"arn:aws:lambda:{region}:{account_id}:function:{function_name}"

def get_resources(api_id):
    resources = client.get_resources(restApiId=api_id)
    return {r.get('path'): r['id'] for r in resources['items']}

# 1. DELETE /auth if exists
res_map = get_resources(api_id)
if '/auth' in res_map:
    print(f"Deleting /auth ({res_map['/auth']})...")
    client.delete_resource(restApiId=api_id, resourceId=res_map['/auth'])
    time.sleep(2) # Wait for deletion

# 2. Re-fetch Root
res_map = get_resources(api_id)
root_id = res_map['/']

# 3. Create Resources
print("Creating /auth...")
auth = client.create_resource(restApiId=api_id, parentId=root_id, pathPart='auth')
auth_id = auth['id']

print("Creating /auth/zoho...")
zoho = client.create_resource(restApiId=api_id, parentId=auth_id, pathPart='zoho')
zoho_id = zoho['id']

print("Creating /auth/zoho/url...")
url_res = client.create_resource(restApiId=api_id, parentId=zoho_id, pathPart='url')
url_id = url_res['id']

print("Creating /auth/zoho/token...")
token_res = client.create_resource(restApiId=api_id, parentId=zoho_id, pathPart='token')
token_id = token_res['id']

# 4. Setup Methods

def setup_endpoint(resource_id, method, lambda_arn):
    # Method
    client.put_method(restApiId=api_id, resourceId=resource_id, httpMethod=method, authorizationType='NONE')
    
    # Integration
    uri = f"arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
    client.put_integration(
        restApiId=api_id, resourceId=resource_id, httpMethod=method,
        type='AWS_PROXY', integrationHttpMethod='POST', uri=uri
    )
    
    # Permission
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId=f"apigateway-recreate-{resource_id}-{method}",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/{method}/*"
        )
    except Exception as e:
        print(f"Permission error (ignore if exists): {e}")

    # Method Response (Not needed for AWS_PROXY, but good for doc)
    # Skipping to avoid BadRequestException for Proxy
    pass
    
    # OPTIONS
    setup_cors(resource_id)

def setup_cors(resource_id):
    client.put_method(restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS', authorizationType='NONE')
    
    # 1. Method Response MUST come before Integration Response
    client.put_method_response(
        restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS', statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Origin': True,
            'method.response.header.Access-Control-Allow-Methods': True,
            'method.response.header.Access-Control-Allow-Headers': True
        }
    )

    client.put_integration(
        restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS', type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )
    
    client.put_integration_response(
        restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS', statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'"
        }
    )

print("Wiring up Endpoints...")
setup_endpoint(url_id, 'GET', lambda_arn)
setup_endpoint(token_id, 'POST', lambda_arn)

# 5. Deploy
print("Deploying...")
time.sleep(2)
client.create_deployment(restApiId=api_id, stageName='prod')
print("Done! Recreated and Deployed.")
