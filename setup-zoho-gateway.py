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

def create_resource(api_id, parent_id, path_part):
    try:
        resp = client.create_resource(
            restApiId=api_id,
            parentId=parent_id,
            pathPart=path_part
        )
        return resp['id']
    except client.exceptions.ConflictException:
        print(f"Resource {path_part} already exists")
        # Refetch to find ID
        res_map = get_resources(api_id)
        # Construct full path logic is hard with just map, simplifying by assuming structure
        # Use a dumb search if needed, or just let the get_resources handle checks before calling this
        return None

def setup_method(api_id, resource_id, http_method, lambda_arn):
    # Method
    try:
        client.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod=http_method,
            authorizationType='NONE'
        )
    except:
        pass # Exists

    # Integration
    uri = f"arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
    client.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod=http_method,
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=uri
    )
    
    # Permission
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId=f"apigateway-{resource_id}-{http_method}",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/{http_method}/*"
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass

    # Method Response (CORS)
    try:
        client.put_method_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod=http_method,
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': True
            }
        )
    except: pass

def setup_cors(api_id, resource_id):
    try:
        client.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
        
        # MOCK integration for OPTIONS
        client.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )
        
        client.put_integration_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'integration.response.header.Access-Control-Allow-Origin': "'*'",
                'integration.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
                'integration.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
            }
        )
        
        client.put_method_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Headers': True
            }
        )
    except Exception as e:
        print(f"CORS Error: {e}")

# MAIN
print("Fetching resources...")
res_map = get_resources(api_id)
root_id = res_map['/']

# Ensure /auth
if '/auth' in res_map:
    auth_id = res_map['/auth']
else:
    print("Creating /auth...")
    auth_id = create_resource(api_id, root_id, 'auth')
    # Refetch
    res_map['/auth'] = auth_id 

# Ensure /auth/zoho
# We need to find /zoho under /auth. The 'path' key in get_resources is full path
if '/auth/zoho' in res_map:
    zoho_id = res_map['/auth/zoho']
else:
    print("Creating /auth/zoho...")
    zoho_id = create_resource(api_id, auth_id, 'zoho')
    res_map['/auth/zoho'] = zoho_id

# Ensure /auth/zoho/url (GET)
if '/auth/zoho/url' in res_map:
    url_id = res_map['/auth/zoho/url']
else:
    print("Creating /auth/zoho/url...")
    url_id = create_resource(api_id, zoho_id, 'url')

print(f"Setting up GET /auth/zoho/url on {url_id}")
setup_method(api_id, url_id, 'GET', lambda_arn)
setup_cors(api_id, url_id)

# Ensure /auth/zoho/token (POST)
if '/auth/zoho/token' in res_map:
    token_id = res_map['/auth/zoho/token']
else:
    print("Creating /auth/zoho/token...")
    token_id = create_resource(api_id, zoho_id, 'token')

print(f"Setting up POST /auth/zoho/token on {token_id}")
setup_method(api_id, token_id, 'POST', lambda_arn)
setup_cors(api_id, token_id)

print("Deploying API...")
client.create_deployment(
    restApiId=api_id,
    stageName='prod'
)
print("Done!")
