import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
api_id = '5cs5faz106'
resource_id = '3t3tev' # /compliance/check

print("Fixing CORS for /compliance/check...")

# 1. Put Integration for OPTIONS
print("Putting Integration for OPTIONS...")
try:
    client.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        type='MOCK',
        requestTemplates={
            'application/json': '{"statusCode":200}'
        }
    )
    print("Integration set.")
except Exception as e:
    print(f"Error putting integration: {e}")

# 2. Put Method Response
print("Putting Method Response for OPTIONS...")
try:
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
    print("Method response set.")
except Exception as e:
    print(f"Error putting method response: {e}")

# 3. Put Integration Response
print("Putting Integration Response for OPTIONS...")
try:
    client.put_integration_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
    )
    print("Integration response set.")
except Exception as e:
    print(f"Error putting integration response: {e}")

# 4. Deploy API
print("Deploying API...")
try:
    client.create_deployment(
        restApiId=api_id,
        stageName='prod'
    )
    print("API Deployed successfully!")
except Exception as e:
    print(f"Error deploying API: {e}")
