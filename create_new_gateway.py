import boto3
import json

def create_gateway():
    client = boto3.client('apigatewayv2', region_name='us-east-2')
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    FUNC_NAME = 'EmailAgentUnified'
    
    # 1. Get Function ARN
    print("Fetching Lambda ARN...")
    func = lambda_client.get_function(FunctionName=FUNC_NAME)
    func_arn = func['Configuration']['FunctionArn']
    
    # 2. Create API
    print("Creating HTTP API...")
    api = client.create_api(
        Name='EmailAgentUnified-API',
        ProtocolType='HTTP',
        Target=func_arn # Quick create route
    )
    api_id = api['ApiId']
    endpoint = api['ApiEndpoint']
    print(f"Created API: {api_id} at {endpoint}")
    
    # 3. Add Permission for API Gateway to invoke Lambda
    print("Adding permissions...")
    try:
        lambda_client.add_permission(
            FunctionName=FUNC_NAME,
            StatementId=f'apigateway-invoke-{api_id}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:us-east-2:397753625517:{api_id}/*/*"
        )
    except lambda_client.exceptions.ResourceConflictException:
        print("Permission already exists.")
        
    print(f"\nSUCCESS! New API Endpoint: {endpoint}")
    print("Update your frontend VITE_API_URL with this.")

if __name__ == '__main__':
    create_gateway()
