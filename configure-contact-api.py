import boto3
import time

client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5cs5faz106'
LAMBDA_ARN = 'arn:aws:lambda:us-east-2:397753625517:function:ManageContactsLambda'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

def get_root_id():
    resources = client.get_resources(restApiId=API_ID)
    for item in resources['items']:
        if item['path'] == '/':
            return item['id']
    return None

def create_resource(parent_id, path_part):
    resources = client.get_resources(restApiId=API_ID)
    for item in resources['items']:
        # Check if resource already exists to avoid duplicate error
        # Note: This is a simple check, path matching is more complex in reality but sufficient here
        if item.get('parentId') == parent_id and item.get('pathPart') == path_part:
            print(f"Resource {path_part} already exists: {item['id']}")
            return item['id']
            
    resp = client.create_resource(
        restApiId=API_ID,
        parentId=parent_id,
        pathPart=path_part
    )
    print(f"Created resource {path_part}: {resp['id']}")
    return resp['id']

def put_method(resource_id, method):
    try:
        client.put_method(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod=method,
            authorizationType='NONE'
        )
        
        # Integration
        uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{LAMBDA_ARN}/invocations"
        client.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod=method,
            type='AWS_PROXY',
            integrationHttpMethod='POST',
            uri=uri
        )
        
        # Add CORS (OPTIONS)
        client.put_method(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
        client.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )
        client.put_method_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Origin': True
            }
        )
        client.put_integration_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS,DELETE'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
        print(f"Configured {method} for {resource_id}")
        
    except Exception as e:
        print(f"Error config method {method}: {e}")

def add_permission(path):
    # Grant API Gateway permission to invoke Lambda
    try:
        source_arn = f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*/{path}"
        lambda_client.add_permission(
            FunctionName='ManageContactsLambda',
            StatementId=f'apigateway-{path}-{int(time.time())}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=source_arn
        )
        print(f"Permission added for {path}")
    except client.exceptions.ResourceConflictException:
        print("Permission already exists")
    except Exception as e:
        print(f"Permission Error: {e}")

# MAIN
root_id = get_root_id()

# 1. /contacts
contacts_id = create_resource(root_id, 'contacts')
put_method(contacts_id, 'GET')
put_method(contacts_id, 'POST')
add_permission('contacts')

# 2. /contacts/tags
tags_id = create_resource(contacts_id, 'tags')
put_method(tags_id, 'GET')
put_method(tags_id, 'POST')
add_permission('contacts/tags')

# 3. /contacts/delete
delete_id = create_resource(contacts_id, 'delete')
put_method(delete_id, 'POST')
add_permission('contacts/delete')


# 4. /contacts/validate
validate_id = create_resource(contacts_id, 'validate')
put_method(validate_id, 'POST')
add_permission('contacts/validate')

# 5. /contacts/batch
batch_id = create_resource(contacts_id, 'batch')
put_method(batch_id, 'POST')
add_permission('contacts/batch')


# Deploy
print("Deploying API...")
client.create_deployment(
    restApiId=API_ID,
    stageName='prod'
)
print("Done!")
