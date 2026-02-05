import boto3
import json
import time

REGION = 'us-east-2'
API_NAME_KEY = "Interon Email Agent API" # Adjust if needed
LAMBDA_NAME = "BounceScannerLambda"
ROUTE_KEY = "POST /campaigns/scan"

client = boto3.client('apigatewayv2', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def get_api_id():
    # Found via system audit
    return "5tdsq6s7h3"

def get_lambda_arn():
    func = lambda_client.get_function(FunctionName=LAMBDA_NAME)
    return func['Configuration']['FunctionArn']

def main():
    api_id = get_api_id()
    if not api_id:
        print("API not found!")
        return

    # 1. Check Route
    routes = client.get_routes(ApiId=api_id)
    existing_route = None
    for r in routes['Items']:
        if r['RouteKey'] == ROUTE_KEY:
            existing_route = r
            print(f"Route {ROUTE_KEY} already exists: {r['RouteId']}")
            break
    
    if existing_route:
        # Check target
        if 'Target' in existing_route:
            print(f"Route has target: {existing_route['Target']}")
            return # Assume it's good
        else:
            print("Route exists but has NO target. Fixing...")
    
    # 2. Get Lambda ARN
    arn = get_lambda_arn()
    print(f"Lambda ARN: {arn}")

    # 3. Create Integration
    # Check existing integrations first to avoid duplicates?
    # Simple Scan
    integrations = client.get_integrations(ApiId=api_id)
    integration_id = None
    for i in integrations['Items']:
        if i.get('IntegrationUri') == arn:
            integration_id = i['IntegrationId']
            print(f"Found existing integration for Lambda: {integration_id}")
            break
            
    if not integration_id:
        print("Creating new integration...")
        resp = client.create_integration(
            ApiId=api_id,
            IntegrationType='AWS_PROXY',
            IntegrationUri=arn,
            PayloadFormatVersion='2.0',
            IntegrationMethod='POST'
        )
        integration_id = resp['IntegrationId']
        print(f"Created Integration: {integration_id}")

    # 4. Create/Update Route
    target = f"integrations/{integration_id}"
    
    if existing_route:
        print(f"Updating route {existing_route['RouteId']} to target {target}")
        client.update_route(
            ApiId=api_id,
            RouteId=existing_route['RouteId'],
            Target=target
        )
    else:
        print(f"Creating route {ROUTE_KEY} -> {target}")
        client.create_route(
            ApiId=api_id,
            RouteKey=ROUTE_KEY,
            Target=target
        )

    # 5. Add Permission
    print("Adding Lambda invoke permission...")
    try:
        lambda_client.add_permission(
            FunctionName=LAMBDA_NAME,
            StatementId=f'apigateway-invoke-{int(time.time())}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:{boto3.client('sts').get_caller_identity()['Account']}:{api_id}/*/*/campaigns/scan"
        )
        print("Permission added.")
    except lambda_client.exceptions.ResourceConflictException:
        print("Permission already exists.")

if __name__ == "__main__":
    main()
