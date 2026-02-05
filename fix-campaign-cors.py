import boto3
import time

api_client = boto3.client('apigateway', region_name='us-east-2')

API_ID = '5cs5faz106'
REGION = 'us-east-2'
RESOURCE_ID = 'y4vxob'  # /campaigns/{campaignId}

print(f"Configuring OPTIONS for resource {RESOURCE_ID} on API {API_ID}")

try:
    # 1. Put OPTIONS Method
    try:
        api_client.put_method(
            restApiId=API_ID,
            resourceId=RESOURCE_ID,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
        print("✅ PUT Method OPTIONS created")
    except Exception as e:
        print(f"ℹ️  Method might exist: {e}")

    # 2. Put Integration (MOCK)
    api_client.put_integration(
        restApiId=API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='OPTIONS',
        type='MOCK',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )
    print("✅ Integration configured to MOCK")

    # 3. Put Integration Response
    api_client.put_integration_response(
        restApiId=API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='OPTIONS',
        statusCode='200',
        responseTemplates={'application/json': ''}
    )
    print("✅ Integration Response configured")

    # 4. Put Method Response (Headers)
    api_client.put_method_response(
        restApiId=API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': True,
            'method.response.header.Access-Control-Allow-Methods': True,
            'method.response.header.Access-Control-Allow-Origin': True
        }
    )
    print("✅ Method Response headers configured")
    
    # 5. Put Integration Response with Headers (Overwrites previous)
    api_client.put_integration_response(
        restApiId=API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='OPTIONS',
        statusCode='200',
        responseTemplates={'application/json': ''},
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
    )
    print("✅ Integration Response headers configured")

    # 6. Deploy
    api_client.create_deployment(
        restApiId=API_ID,
        stageName='prod'
    )
    print("✅ API Deployed")

except Exception as e:
    print(f"❌ Error: {str(e)}")
