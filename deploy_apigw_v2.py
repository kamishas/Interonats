
import boto3
import json
import time
import traceback

FUNCTION_NAME = "InteronSimpleService"
REGION = "us-east-1"
API_NAME = "InteronAddressGatewayV2"

lambda_client = boto3.client('lambda', region_name=REGION)
apigw = boto3.client('apigatewayv2', region_name=REGION)
sts = boto3.client('sts', region_name=REGION)

def deploy_apigw():
    try:
        # 0. Get Account ID
        account_id = sts.get_caller_identity()['Account']
        print(f"Account ID: {account_id}")

        # 1. Get Function ARN
        print("Getting Lambda ARN...")
        func = lambda_client.get_function(FunctionName=FUNCTION_NAME)
        func_arn = func['Configuration']['FunctionArn']
        
        # 2. Create API
        print("Creating HTTP API...")
        api = apigw.create_api(
            Name=API_NAME,
            ProtocolType='HTTP',
            CorsConfiguration={
                'AllowOrigins': ['*'],
                'AllowMethods': ['POST', 'OPTIONS'],
                'AllowHeaders': ['Content-Type', 'Authorization'],
                'MaxAge': 300
            }
        )
        api_id = api['ApiId']
        api_endpoint = api['ApiEndpoint']
        print(f"API Created: {api_id} ({api_endpoint})")
        
        # 3. Create Integration
        print("Creating Integration...")
        integration = apigw.create_integration(
            ApiId=api_id,
            IntegrationType='AWS_PROXY',
            IntegrationUri=func_arn,
            PayloadFormatVersion='2.0'
        )
        integration_id = integration['IntegrationId']

        # 4. Create Route
        print("Creating Route POST /...")
        apigw.create_route(
            ApiId=api_id,
            RouteKey='POST /',
            Target=f"integrations/{integration_id}"
        )

        # 5. Add Permission to Lambda
        print("Granting Permission to API Gateway...")
        try:
            lambda_client.add_permission(
                FunctionName=FUNCTION_NAME,
                StatementId=f"apigateway-invoke-{api_id}",
                Action='lambda:InvokeFunction',
                Principal='apigateway.amazonaws.com',
                SourceArn=f"arn:aws:execute-api:{REGION}:{account_id}:{api_id}/*/*/POST/"
                # Grant specific permission for POST /
            )
            print("Permission added.")
        except lambda_client.exceptions.ResourceConflictException:
            print("Permission exists.")

        print(f"SUCCESS! API URL: {api_endpoint}/")
        
        with open("apigw_url.txt", "w") as f:
            f.write(f"{api_endpoint}/")

    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    deploy_apigw()
