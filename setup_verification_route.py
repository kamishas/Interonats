import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')
api_id = '5cs5faz106'
region = 'us-east-2'
account_id = boto3.client('sts', region_name=region).get_caller_identity().get('Account')

def get_resource_id(parent_id, path_part):
    resources = client.get_resources(restApiId=api_id, limit=500)['items']
    for r in resources:
        # Check if resource matches parent and path part
        # Note: Root resource has no parentId, others do
        if r.get('parentId') == parent_id and r.get('pathPart') == path_part:
            return r['id']
    return None

def create_cors_options(resource_id):
    print(f"Creating OPTIONS for resource {resource_id}...")
    try:
        client.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
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
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS,PUT,DELETE'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
        print("CORS OPTIONS created.")
    except client.exceptions.ConflictException:
        print("OPTIONS method already exists. Skipping creation (updating integration response if needed could be done here).")

def setup_verification_route():
    print(f"Configuring API {api_id} for /contacts/verify-email...")
    
    # 1. Get Lambda ARN
    func = lambda_client.get_function(FunctionName='ManageContactsLambda')
    lambda_arn = func['Configuration']['FunctionArn']
    # Format: arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations
    lambda_uri = f"arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
    
    # 2. Find Resources
    resources = client.get_resources(restApiId=api_id, limit=500)['items']
    
    # Find /contacts
    contacts_res = next((r for r in resources if r.get('path') == '/contacts'), None)
    if not contacts_res:
        print("Error: /contacts resource not found. Please ensure base resources exist.")
        return
    contacts_id = contacts_res['id']
    
    # Check/Create /contacts/verify-email
    verify_id = get_resource_id(contacts_id, 'verify-email')
    if not verify_id:
        print("Creating /contacts/verify-email resource...")
        resp = client.create_resource(
            restApiId=api_id,
            parentId=contacts_id,
            pathPart='verify-email'
        )
        verify_id = resp['id']
    else:
        print(f"Found existing /contacts/verify-email resource: {verify_id}")

    # 3. Setup POST Method
    print("Configuring POST method...")
    try:
        client.put_method(
            restApiId=api_id,
            resourceId=verify_id,
            httpMethod='POST',
            authorizationType='NONE' 
        )
    except client.exceptions.ConflictException:
        pass # Method exists
        
    client.put_integration(
        restApiId=api_id,
        resourceId=verify_id,
        httpMethod='POST',
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=lambda_uri
    )
    
    # Add Permission for API Gateway to invoke Lambda
    try:
        lambda_client.add_permission(
            FunctionName='ManageContactsLambda',
            StatementId=f'apigateway-verify-email-{verify_id}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/POST/contacts/verify-email"
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass # Permission exists

    # 4. Setup CORS (OPTIONS)
    create_cors_options(verify_id)

    # 5. Deploy API
    print("Deploying API...")
    client.create_deployment(
        restApiId=api_id,
        stageName='prod'
    )
    print("API Deployed successfully!")

if __name__ == "__main__":
    setup_verification_route()
