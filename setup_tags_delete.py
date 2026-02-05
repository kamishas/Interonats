import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')
api_id = '5cs5faz106' # API ID from previous context
region = 'us-east-2'
account_id = boto3.client('sts', region_name=region).get_caller_identity().get('Account')

def get_resource_id(parent_id, path_part):
    resources = client.get_resources(restApiId=api_id, limit=500)['items']
    for r in resources:
        if r.get('parentId') == parent_id and r.get('pathPart') == path_part:
            return r['id']
    return None

def find_resource_by_path(path):
    resources = client.get_resources(restApiId=api_id, limit=500)['items']
    return next((r for r in resources if r.get('path') == path), None)

def create_cors_options(resource_id):
    print(f"Updating CORS for resource {resource_id}...")
    try:
        # We need to update existing OPTIONS or create if missing
        try:
             client.put_method(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod='OPTIONS',
                authorizationType='NONE'
            )
        except client.exceptions.ConflictException:
            pass 

        client.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )
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
        client.put_integration_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,DELETE,OPTIONS,PUT'", # Added DELETE
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
        print("CORS OPTIONS updated.")
    except Exception as e:
        print(f"Error updating CORS: {e}")

def setup_tags_delete():
    print(f"Configuring API {api_id} for DELETE /contacts/tags...")
    
    # 1. Get Lambda ARN
    func = lambda_client.get_function(FunctionName='ManageContactsLambda')
    lambda_arn = func['Configuration']['FunctionArn']
    lambda_uri = f"arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
    
    # 2. Find /contacts/tags Resource
    tags_res = find_resource_by_path('/contacts/tags')
    if not tags_res:
        print("Error: /contacts/tags resource not found.")
        # Try to find /contacts and then 'tags' child?
        # Assuming it exists because user saw GET/POST working previously or just VIEWED tags.
        # If it doesn't exist, we need to create it.
        # Let's be robust.
        contacts_res = find_resource_by_path('/contacts')
        if not contacts_res:
             print("Error: /contacts resource not found.")
             return
        tags_id = get_resource_id(contacts_res['id'], 'tags')
        if not tags_id:
             print("Creating /contacts/tags resource...")
             resp = client.create_resource(restApiId=api_id, parentId=contacts_res['id'], pathPart='tags')
             tags_id = resp['id']
    else:
        tags_id = tags_res['id']
        print(f"Found /contacts/tags resource: {tags_id}")

    # 3. Setup DELETE Method
    print("Configuring DELETE method...")
    try:
        client.put_method(
            restApiId=api_id,
            resourceId=tags_id,
            httpMethod='DELETE',
            authorizationType='NONE'
        )
    except client.exceptions.ConflictException:
        print("DELETE method already exists, updating integration...")
        
    client.put_integration(
        restApiId=api_id,
        resourceId=tags_id,
        httpMethod='DELETE',
        type='AWS_PROXY',
        integrationHttpMethod='POST', # Lambda invocations are always POST
        uri=lambda_uri
    )
    
    # Add Permission for API Gateway to invoke Lambda
    try:
        lambda_client.add_permission(
            FunctionName='ManageContactsLambda',
            StatementId=f'apigateway-tags-delete-{tags_id}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/DELETE/contacts/tags"
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass 

    # 4. Update CORS (OPTIONS) to include DELETE
    create_cors_options(tags_id)

    # 5. Deploy API
    print("Deploying API...")
    client.create_deployment(
        restApiId=api_id,
        stageName='prod'
    )
    print("API Deployed successfully!")

if __name__ == "__main__":
    setup_tags_delete()
