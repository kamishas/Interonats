import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')
api_id = '5cs5faz106'

print(f"Fixing API {api_id}...")

# 1. Fix /images POST
print("Fixing /images POST...")
try:
    # Get Lambda ARN
    func = lambda_client.get_function(FunctionName='ImageComplianceLambda')
    lambda_arn = func['Configuration']['FunctionArn']
    lambda_uri = f"arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
    
    # Get Resource ID
    resources = client.get_resources(restApiId=api_id)['items']
    images_res = next(r for r in resources if r.get('path') == '/images')
    images_id = images_res['id']
    
    client.put_integration(
        restApiId=api_id,
        resourceId=images_id,
        httpMethod='POST',
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=lambda_uri
    )
    print("Integration set for /images POST.")
except Exception as e:
    print(f"Error fixing /images POST: {e}")

# 2. Deploy API
print("Deploying API...")
try:
    client.create_deployment(
        restApiId=api_id,
        stageName='prod'
    )
    print("API Deployed successfully!")
except Exception as e:
    print(f"Error deploying API: {e}")
