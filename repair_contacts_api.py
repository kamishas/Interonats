import boto3
import json
import time

API_ID = '5cs5faz106'
REGION = 'us-east-2'
LAMBDA_ARN = 'arn:aws:lambda:us-east-2:397753625517:function:ManageContactsLambda' 
# ^^ Verified from previous steps

client = boto3.client('apigateway', region_name=REGION)

def get_resources():
    items = []
    position = None
    while True:
        if position:
            resp = client.get_resources(restApiId=API_ID, limit=500, position=position)
        else:
            resp = client.get_resources(restApiId=API_ID, limit=500)
        
        items.extend(resp['items'])
        position = resp.get('position')
        if not position:
            break
    return items

def get_or_create_resource(parent_id, path_part, current_resources):
    # Check if exists
    for item in current_resources:
        if item.get('parentId') == parent_id and item.get('pathPart') == path_part:
            print(f"Resource {path_part} found: {item['id']}")
            return item['id']
            
    # Create
    print(f"Creating resource {path_part} under {parent_id}...")
    resp = client.create_resource(
        restApiId=API_ID,
        parentId=parent_id,
        pathPart=path_part
    )
    return resp['id']

def configure_method(resource_id, method, integration_type='AWS_PROXY'):
    # Put Method
    try:
        client.put_method(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod=method,
            authorizationType='NONE'
        )
    except client.exceptions.ConflictException:
        pass # Exists

    # Put Integration
    if integration_type == 'AWS_PROXY':
        uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{LAMBDA_ARN}/invocations"
        client.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod=method,
            type='AWS_PROXY',
            integrationHttpMethod='POST',
            uri=uri
        )
    elif integration_type == 'MOCK':
        client.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod=method,
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )

    # Responses for CORS (MOCK only)
    if integration_type == 'MOCK':
        try:
            client.put_method_response(
                restApiId=API_ID,
                resourceId=resource_id,
                httpMethod=method,
                statusCode='200',
                responseParameters={
                    'method.response.header.Access-Control-Allow-Headers': True,
                    'method.response.header.Access-Control-Allow-Methods': True,
                    'method.response.header.Access-Control-Allow-Origin': True
                }
            )
        except client.exceptions.ConflictException:
            pass
            
        try:
            client.put_integration_response(
                restApiId=API_ID,
                resourceId=resource_id,
                httpMethod=method,
                statusCode='200',
                responseParameters={
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                    'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS,DELETE'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'"
                }
            )
        except Exception as e:
            print(f"Error setting CORS response: {e}")

def main():
    print("Scanning API Resources...")
    resources = get_resources()
    
    # 1. Root
    root_id = [r['id'] for r in resources if r['path'] == '/'][0]
    
    # 2. /contacts
    contacts_id = get_or_create_resource(root_id, 'contacts', resources)
    configure_method(contacts_id, 'GET')   # List
    configure_method(contacts_id, 'POST')  # Add
    configure_method(contacts_id, 'OPTIONS', 'MOCK') # CORS
    
    # 3. /contacts/tags
    # Need to update 'resources' list if we created new ones, but for simplicity relying on get_or_create logic if re-run or assuming linear creation.
    # To be safe, let's re-fetch or just track locally?
    # Actually, get_or_create returns ID.
    
    # Re-fetch just in case we need updated parent relationships? 
    # Actually we just pass parent_id.
    
    # Check if 'tags' already exists in the INITIAL list to find its ID if it does.
    # Refetching is safer for the loop.
    resources = get_resources() 
    
    tags_id = get_or_create_resource(contacts_id, 'tags', resources)
    configure_method(tags_id, 'GET')
    configure_method(tags_id, 'POST')
    configure_method(tags_id, 'OPTIONS', 'MOCK')

    del_id = get_or_create_resource(contacts_id, 'delete', resources)
    configure_method(del_id, 'POST')
    configure_method(del_id, 'OPTIONS', 'MOCK')
    
    val_id = get_or_create_resource(contacts_id, 'validate', resources)
    configure_method(val_id, 'POST')
    configure_method(val_id, 'OPTIONS', 'MOCK')
    
    batch_id = get_or_create_resource(contacts_id, 'batch', resources)
    configure_method(batch_id, 'POST')
    configure_method(batch_id, 'OPTIONS', 'MOCK')
    
    print("Resources configured. Deploying...")
    try:
        client.create_deployment(
            restApiId=API_ID,
            stageName='prod',
            description='Repaired Contacts API and CORS'
        )
        print("Deployed successfully.")
    except Exception as e:
        print(f"Deployment error: {e}")

if __name__ == '__main__':
    main()
