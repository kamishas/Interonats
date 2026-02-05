import boto3
import time

API_ID = '5cs5faz106'
REGION = 'us-east-2'
client = boto3.client('apigateway', region_name=REGION)

def fix_cors():
    # 1. Find Resource
    resources = client.get_resources(restApiId=API_ID, limit=500)['items']
    res_id = None
    for r in resources:
        if 'recipients' in r.get('path', ''):
            res_id = r['id']
            break
            
    if not res_id:
        print("Resource not found")
        return

    print(f"Fixing CORS for Resource: {res_id}")

    # 2. Delete OPTIONS (to start fresh)
    try:
        client.delete_method(restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS')
        print("Deleted existing OPTIONS")
        time.sleep(1)
    except Exception:
        pass

    # 3. Create OPTIONS Method
    client.put_method(
        restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS',
        authorizationType='NONE', apiKeyRequired=False
    )

    # 4. Method Response (Define headers)
    client.put_method_response(
        restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', statusCode='200',
        responseModels={'application/json': 'Empty'},
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': True,
            'method.response.header.Access-Control-Allow-Methods': True,
            'method.response.header.Access-Control-Allow-Origin': True
        }
    )

    # 5. Integration (MOCK)
    client.put_integration(
        restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )

    # 6. Integration Response (Map headers)
    client.put_integration_response(
        restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
    )
    
    print("✅ OPTIONS Configured.")

    # 7. Deploy
    print("Deploying...")
    client.create_deployment(restApiId=API_ID, stageName='prod')
    print("✅ Deployed.")

if __name__ == "__main__":
    fix_cors()
