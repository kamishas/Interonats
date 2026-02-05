import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')
api_id = '5cs5faz106'

def find_resource_by_path(path):
    resources = client.get_resources(restApiId=api_id, limit=500)['items']
    return next((r for r in resources if r.get('path') == path), None)

def fix_ai_cors():
    print(f"Fixing CORS for /ai/generate on API {api_id}...")
    
    # 1. Locate Resource
    ai_res = find_resource_by_path('/ai/generate')
    if not ai_res:
        print("Resource /ai/generate not found!")
        return
    
    resource_id = ai_res['id']
    print(f"Found resource ID: {resource_id}")

    # 2. Check Integration
    try:
        integration = client.get_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='POST'
        )
        uri = integration.get('uri', '')
        print(f"Current Integration URI: {uri}")
        if 'function:' in uri:
            func_name = uri.split('function:')[1].split('/')[0]
            print(f"Connected Lambda: {func_name}")
    except Exception as e:
        print(f"Could not check integration: {e}")

    # 3. Setup OPTIONS Method (CORS)
    print("Configuring OPTIONS method...")
    try:
        # Delete existing if any, to be safe (Hard Reset)
        try:
            client.delete_method(restApiId=api_id, resourceId=resource_id, httpMethod='OPTIONS')
            print("Deleted existing OPTIONS.")
        except:
            pass
        
        client.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
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
        
        # MOCK Integration for OPTIONS
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
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS,PUT'", 
                'method.response.header.Access-Control-Allow-Origin': "'*'" # CRITICAL
            }
        )
        print("CORS OPTIONS configured successfully.")

    except Exception as e:
        print(f"Error setting up CORS: {e}")

    # 4. Deploy
    print("Deploying API...")
    client.create_deployment(
        restApiId=api_id,
        stageName='prod'
    )
    print("API Deployed!")

if __name__ == "__main__":
    fix_ai_cors()
