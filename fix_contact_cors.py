import boto3
import sys

# Config
API_ID = '5cs5faz106'
REGION = 'us-east-2'

client = boto3.client('apigateway', region_name=REGION)

def enable_cors(resource_id, path_part):
    print(f"Enabling CORS for {path_part} ({resource_id})...")
    
    # 1. Put OPTIONS Method
    try:
        client.put_method(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
    except client.exceptions.ConflictException:
        pass # Already exists
        
    # 2. Put Integration (MOCK)
    try:
        client.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )
    except Exception as e:
        print(f"Error putting integration: {e}")

    # 3. Method Response (200)
    try:
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
    except client.exceptions.ConflictException:
        pass

    # 4. Integration Response
    try:
        client.put_integration_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS,DELETE'",
                'method.response.header.Access-Control-Allow-Origin': "'*'" # Use specific origin if strict security needed, '*' for now
            }
        )
    except Exception as e:
        print(f"Error putting integration response: {e}")
    
    print(f"CORS enabled for {path_part}")


def main():
    try:
        resources = client.get_resources(restApiId=API_ID, limit=500)
        
        # Find all contact resources
        contact_resources = []
        contacts_id = None
        
        for item in resources['items']:
            path = item.get('path', '')
            if '/contacts' in path:
                contact_resources.append(item)
                if path == '/contacts':
                    contacts_id = item['id']
        
        print(f"Found {len(contact_resources)} contact resources.")
        
        for res in contact_resources:
            enable_cors(res['id'], res.get('path'))

        # Deploy
        print("Deploying API...")
        client.create_deployment(
            restApiId=API_ID,
            stageName='prod',
            description='Fixed CORS for Contacts'
        )
        print("Deployment complete.")

    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == '__main__':
    main()
