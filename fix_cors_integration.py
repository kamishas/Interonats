import boto3
import sys

def fix_cors():
    client = boto3.client('apigateway', region_name='us-east-2')
    api_id = '5cs5faz106'
    resource_id = 'y4vxob'
    lambda_arn = 'arn:aws:lambda:us-east-2:397753625517:function:GetCampaignLambda'
    uri = f"arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"

    print(f"Updating OPTIONS integration for resource {resource_id} in API {api_id}...")
    
    try:
        # Update OPTIONS to AWS_PROXY
        client.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='AWS_PROXY',
            integrationHttpMethod='POST', # Lambda invocation is always POST
            uri=uri,
            passthroughBehavior='WHEN_NO_MATCH' 
        )
        print("OPTIONS integration updated to AWS_PROXY.")
    except Exception as e:
        print(f"Error updating OPTIONS: {e}")

    try:
        # Update GET to AWS_PROXY (Verify it points to the right place too)
        client.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='GET',
            type='AWS_PROXY',
            integrationHttpMethod='POST',
            uri=uri,
            passthroughBehavior='WHEN_NO_MATCH'
        )
        print("GET integration updated to AWS_PROXY.")
    except Exception as e:
        print(f"Error updating GET: {e}")

    print("Deploying API to 'prod' stage...")
    try:
        client.create_deployment(
            restApiId=api_id,
            stageName='prod',
            description='Fixed CORS for GetCampaign endpoint'
        )
        print("Deployment successful.")
    except Exception as e:
        print(f"Error deploying API: {e}")

if __name__ == "__main__":
    fix_cors()
