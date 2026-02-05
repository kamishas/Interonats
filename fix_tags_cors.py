import boto3
import time

client = boto3.client('apigateway', region_name='us-east-2')
api_id = '5cs5faz106'

def get_resource_id(path_part, parent_id=None):
    resources = client.get_resources(restApiId=api_id, limit=500)['items']
    for r in resources:
        if r.get('pathPart') == path_part:
            if parent_id:
                if r.get('parentId') == parent_id:
                    return r['id']
            else:
                return r['id']
    return None

def find_resource_by_path(path):
    resources = client.get_resources(restApiId=api_id, limit=500)['items']
    return next((r for r in resources if r.get('path') == path), None)

def fix_tags_cors():
    print(f"Fixing CORS for /contacts/tags on API {api_id}...")
    
    # Locate Resource
    tags_res = find_resource_by_path('/contacts/tags')
    if not tags_res:
        print("Resource /contacts/tags not found!")
        return
    
    resource_id = tags_res['id']
    print(f"Found resource ID: {resource_id}")

    # 1. DELETE existing OPTIONS if present (Reset)
    try:
        client.delete_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS'
        )
        print("Deleted existing OPTIONS method.")
        time.sleep(1) # Safety delay
    except client.exceptions.NotFoundException:
        print("No existing OPTIONS method found.")

    # 2. CREATE OPTIONS Method
    print("Creating OPTIONS method...")
    client.put_method(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        authorizationType='NONE'
    )

    # 3. Method Response
    print("Setting Method Response...")
    client.put_method_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': True,
            'method.response.header.Access-Control-Allow-Methods': True,
            'method.response.header.Access-Control-Allow-Origin': True
        }
    )

    # 4. Integration (MOCK)
    print("Setting Mock Integration...")
    client.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )

    # 5. Integration Response
    print("Setting Integration Response...")
    client.put_integration_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,DELETE,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
    )

    # 6. Deploy
    print("Deploying API...")
    client.create_deployment(
        restApiId=api_id,
        stageName='prod'
    )
    print("SUCCESS: CORS fixed and API deployed.")

if __name__ == "__main__":
    fix_tags_cors()
