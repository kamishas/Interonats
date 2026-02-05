import boto3
import time

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("ADDING POST /SEND ROUTE TO API GATEWAY")
print("="*80)

route_key = 'POST /campaigns/{campaignId}/send'
lambda_name = 'SendCampaignLambda'
lambda_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{lambda_name}"

try:
    # 1. Check/Delete Existing Route
    routes = apigateway.get_routes(ApiId=API_ID)
    existing_route = next((r for r in routes['Items'] if r.get('RouteKey') == route_key), None)
    
    if existing_route:
        route_id = existing_route['RouteId']
        print(f"Route exists: {route_id}")
        apigateway.delete_route(ApiId=API_ID, RouteId=route_id)
        print("Deleted old route")
    
    # 2. Add Permission for API Gateway to invoke Lambda
    try:
        statement_id = f"apigw-invoke-{int(time.time())}"
        lambda_client.add_permission(
            FunctionName=lambda_name,
            StatementId=statement_id,
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*"
        )
        print(f"✅ Added Lambda permission: {statement_id}")
    except lambda_client.exceptions.ResourceConflictException:
        print("⚠️  Lambda permission already exists")

    # 3. Create Integration
    integration = apigateway.create_integration(
        ApiId=API_ID,
        IntegrationType='AWS_PROXY',
        IntegrationUri=lambda_arn,
        IntegrationMethod='POST',
        PayloadFormatVersion='2.0',
        TimeoutInMillis=29000  # Max for API Gateway
    )
    print(f"✅ Integration created: {integration['IntegrationId']}")
    
    # 4. Create Route
    route = apigateway.create_route(
        ApiId=API_ID,
        RouteKey=route_key,
        Target=f"integrations/{integration['IntegrationId']}"
    )
    print(f"✅ Route created: {route['RouteId']}")
    
    print(f"\n✅ POST /send route added successfully!")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print(f"\n{'='*80}")
