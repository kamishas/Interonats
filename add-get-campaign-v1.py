import boto3
import time

api_client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5cs5faz106'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'
RESOURCE_ID = 'y4vxob'  # /campaigns/{campaignId}
LAMBDA_FUNCTION = 'ListCampaignsLambda'

lambda_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{LAMBDA_FUNCTION}"
uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"

print(f"Configuring GET for resource {RESOURCE_ID} on API {API_ID}")

try:
    # 1. Put GET Method
    try:
        api_client.put_method(
            restApiId=API_ID,
            resourceId=RESOURCE_ID,
            httpMethod='GET',
            authorizationType='NONE'
        )
        print("✅ PUT Method GET created")
    except Exception as e:
        print(f"ℹ️  Method might exist: {e}")

    # 2. Put Integration
    api_client.put_integration(
        restApiId=API_ID,
        resourceId=RESOURCE_ID,
        httpMethod='GET',
        type='AWS_PROXY',
        integrationHttpMethod='POST', 
        uri=uri
    )
    print("✅ Integration configured to ListCampaignsLambda")

    # 3. Add Permission
    try:
        lambda_client.add_permission(
            FunctionName=LAMBDA_FUNCTION,
            StatementId=f"apigw-invoke-get-campaign-{int(time.time())}",
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/GET/campaigns/*"
        )
        print("✅ Lambda permission added")
    except lambda_client.exceptions.ResourceConflictException:
        print("ℹ️  Lambda permission already exists")

    # 4. Deploy
    api_client.create_deployment(
        restApiId=API_ID,
        stageName='prod'
    )
    print("✅ API Deployed")

except Exception as e:
    print(f"❌ Error: {str(e)}")
