import boto3
import json

def add_route():
    apigateway = boto3.client('apigateway', region_name='us-east-2')
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    # 1. Get API
    apis = apigateway.get_rest_apis()['items']
    api_id = next(a['id'] for a in apis if 'EmailAgent' in a['name'])
    print(f"Found API: {api_id}")
    
    # 2. Get Resources
    resources = apigateway.get_resources(restApiId=api_id)['items']
    root_id = next(r['id'] for r in resources if r['path'] == '/')
    
    # Get/Create /campaigns
    campaigns_res = next((r for r in resources if r.get('path') == '/campaigns'), None)
    if not campaigns_res:
        print("Creating /campaigns resource...")
        campaigns_res = apigateway.create_resource(restApiId=api_id, parentId=root_id, pathPart='campaigns')
    
    # Get/Create /campaigns/scan
    scan_res = next((r for r in resources if r.get('path') == '/campaigns/scan'), None)
    if not scan_res:
        print("Creating /campaigns/scan resource...")
        scan_res = apigateway.create_resource(restApiId=api_id, parentId=campaigns_res['id'], pathPart='scan')
    
    scan_id = scan_res['id']
    
    # 3. Method POST
    try:
        apigateway.put_method(
            restApiId=api_id,
            resourceId=scan_id,
            httpMethod='POST',
            authorizationType='NONE'
        )
    except:
        pass # Exists
        
    # 4. Integration
    # Get Lambda ARN
    func = lambda_client.get_function(FunctionName='BounceScannerLambda')
    func_arn = func['Configuration']['FunctionArn']
    
    uri = f"arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/{func_arn}/invocations"
    
    apigateway.put_integration(
        restApiId=api_id,
        resourceId=scan_id,
        httpMethod='POST',
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=uri
    )
    
    # Enable CORS
    try:
        apigateway.put_method(restApiId=api_id, resourceId=scan_id, httpMethod='OPTIONS', authorizationType='NONE')
        apigateway.put_integration(
             restApiId=api_id, resourceId=scan_id, httpMethod='OPTIONS', type='MOCK',
             requestTemplates={'application/json': '{"statusCode": 200}'}
        )
        apigateway.put_method_response(
            restApiId=api_id, resourceId=scan_id, httpMethod='OPTIONS', statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Origin': True
            }
        )
        apigateway.put_integration_response(
            restApiId=api_id, resourceId=scan_id, httpMethod='OPTIONS', statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
    except Exception as e:
        print(f"CORS Warning: {e}")

    # 5. Permission
    try:
        lambda_client.add_permission(
            FunctionName='BounceScannerLambda',
            StatementId=f'apigateway-invoke-scan-{int(time.time())}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:us-east-2:{boto3.client('sts').get_caller_identity()['Account']}:{api_id}/*/POST/campaigns/scan"
        )
        print("Permission added.")
    except Exception as e:
        print(f"Permission exists? {e}")

    # 6. Deploy
    apigateway.create_deployment(restApiId=api_id, stageName='prod')
    print("✅ API Deployed.")
    print(f"Endpoint: POST {api_id}.execute-api.us-east-2.amazonaws.com/prod/campaigns/scan")

import time
if __name__ == "__main__":
    add_route()
