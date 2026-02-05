import boto3
import time

API_ID = '5cs5faz106'
REGION = 'us-east-2'
ACCOUNT_ID = boto3.client('sts').get_caller_identity()['Account']
FUNC_NAME = 'ManageRecipientsLambda'

apigateway = boto3.client('apigateway', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def fix_route():
    print(f"Fixing Route for API: {API_ID}")
    
    # 1. Get Function ARN
    print(f"Fetching ARN for {FUNC_NAME}...")
    func = lambda_client.get_function(FunctionName=FUNC_NAME)
    func_arn = func['Configuration']['FunctionArn']
    print(f"ARN: {func_arn}")
    
    # 2. Find Resource /campaigns/{campaignId}/recipients
    resources = apigateway.get_resources(restApiId=API_ID, limit=500)['items']
    recipients_res = None
    for r in resources:
        if 'recipients' in r.get('path', ''):
            recipients_res = r
            break
            
    if not recipients_res:
        print("❌ Could not find /recipients resource!")
        return
        
    res_id = recipients_res['id']
    print(f"Found Resource ID: {res_id} ({recipients_res['path']})")
    
    # 3. Setup Integration
    uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{func_arn}/invocations"
    
    for method in ['GET', 'POST', 'OPTIONS']:
        print(f"Configuring {method}...")
        
        # Put Method
        try:
            apigateway.put_method(
                restApiId=API_ID,
                resourceId=res_id,
                httpMethod=method,
                authorizationType='NONE'
            )
        except Exception as e:
            pass # Exists
            
        if method == 'OPTIONS':
            # Mock Integration for CORS
            apigateway.put_integration(
                restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', type='MOCK',
                requestTemplates={'application/json': '{"statusCode": 200}'}
            )
            apigateway.put_method_response(
                restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', statusCode='200',
                responseParameters={
                    'method.response.header.Access-Control-Allow-Headers': True,
                    'method.response.header.Access-Control-Allow-Methods': True,
                    'method.response.header.Access-Control-Allow-Origin': True
                }
            )
            apigateway.put_integration_response(
                restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', statusCode='200',
                responseParameters={
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                    'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'"
                }
            )
        else:
            # Lambda Integration
            apigateway.put_integration(
                restApiId=API_ID,
                resourceId=res_id,
                httpMethod=method,
                type='AWS_PROXY',
                integrationHttpMethod='POST',
                uri=uri
            )
            
    # 4. Deploy
    print("Deploying API...")
    apigateway.create_deployment(restApiId=API_ID, stageName='prod')
    print("✅ Deployment Complete.")

if __name__ == "__main__":
    fix_route()
