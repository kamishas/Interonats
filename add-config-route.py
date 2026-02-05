import boto3
import json

def add_config_route():
    client = boto3.client('apigatewayv2', region_name='us-east-2')
    
    # 1. Get API ID (Data API)
    apis = client.get_apis()
    api_id = None
    for item in apis['Items']:
        if item['Name'] == 'InteronEmailDataAPI':
            api_id = item['ApiId']
            break
            
    if not api_id:
        print("Error: Could not find InteronEmailDataAPI")
        return

    print(f"Found API ID: {api_id}")
    
    # 2. Get Lambda ARN
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    fn = lambda_client.get_function(FunctionName='ManageConfigLambda')
    lambda_arn = fn['Configuration']['FunctionArn']
    
    # 3. Create Integration
    integration_resp = client.create_integration(
        ApiId=api_id,
        IntegrationType='AWS_PROXY',
        IntegrationUri=lambda_arn,
        PayloadFormatVersion='2.0'
    )
    integration_id = integration_resp['IntegrationId']
    print(f"Created Integration: {integration_id}")
    
    # 4. Create Routes
    routes = ['GET /config', 'POST /config']
    for route_key in routes:
        try:
            client.create_route(
                ApiId=api_id,
                RouteKey=route_key,
                Target=f"integrations/{integration_id}"
            )
            print(f"Created Route: {route_key}")
        except Exception as e:
            print(f"Route {route_key} might already exist: {e}")
            
    # 5. Add Lambda Permission
    try:
        lambda_client.add_permission(
            FunctionName='ManageConfigLambda',
            StatementId=f'apigateway-config-{api_id}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:us-east-2:533267154876:{api_id}/*/*/config"
        )
        print("Added Lambda Permission")
    except Exception as e:
         print(f"Permission might already exist: {e}")

if __name__ == '__main__':
    add_config_route()
