
import boto3
import json
import time
import traceback

FUNCTION_NAME = "InteronSimpleService"
REGION = "us-east-1"
API_NAME = "InteronAddressGatewayV3" # Version 3

lambda_client = boto3.client('lambda', region_name=REGION)
apigw = boto3.client('apigatewayv2', region_name=REGION)
sts = boto3.client('sts', region_name=REGION)

def deploy_apigw():
    try:
        account_id = sts.get_caller_identity()['Account']
        
        # Function ARN
        func = lambda_client.get_function(FunctionName=FUNCTION_NAME)
        func_arn = func['Configuration']['FunctionArn']
        
        # Create API
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
        print(f"API Created: {api_id}")
        
        # Integration
        integration = apigw.create_integration(
            ApiId=api_id,
            IntegrationType='AWS_PROXY',
            IntegrationUri=func_arn,
            PayloadFormatVersion='2.0'
        )
        integration_id = integration['IntegrationId']

        # Route
        apigw.create_route(
            ApiId=api_id,
            RouteKey='POST /',
            Target=f"integrations/{integration_id}"
        )
        
        # STAGE (Explicitly Create $default)
        print("Creating $default Stage...")
        try:
            apigw.create_stage(
                ApiId=api_id,
                StageName='$default',
                AutoDeploy=True
            )
            print("$default stage created.")
        except apigw.exceptions.ConflictException:
            print("$default stage exists.")

        # Permission
        try:
            lambda_client.add_permission(
                FunctionName=FUNCTION_NAME,
                StatementId=f"apigateway-invoke-{api_id}",
                Action='lambda:InvokeFunction',
                Principal='apigateway.amazonaws.com',
                SourceArn=f"arn:aws:execute-api:{REGION}:{account_id}:{api_id}/*/*/POST/"
            )
        except lambda_client.exceptions.ResourceConflictException:
            pass

        print(f"SUCCESS! URL: {api_endpoint}/")
        with open("apigw_v3_url.txt", "w") as f:
            f.write(f"{api_endpoint}/")

    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    deploy_apigw()
