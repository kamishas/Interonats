import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("ADDING POST /contacts/validate ROUTE")
print("="*80)

lambda_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:ValidateContactsLambda"

try:
    # Create integration
    print("\n1. Creating Lambda integration...")
    integration = apigateway.create_integration(
        ApiId=API_ID,
        IntegrationType='AWS_PROXY',
        IntegrationUri=lambda_arn,
        IntegrationMethod='POST',
        PayloadFormatVersion='2.0',
        TimeoutInMillis=30000
    )
    print(f"✅ Integration created: {integration['IntegrationId']}")
    
    # Create POST route
    print("\n2. Creating POST /contacts/validate route...")
    route = apigateway.create_route(
        ApiId=API_ID,
        RouteKey='POST /contacts/validate',
        Target=f"integrations/{integration['IntegrationId']}"
    )
    print(f"✅ Route created: {route['RouteId']}")
    
    # Grant permission
    print("\n3. Granting Lambda invoke permission...")
    try:
        lambda_client.add_permission(
            FunctionName='ValidateContactsLambda',
            StatementId='apigateway-post-contacts-validate',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*"
        )
        print("✅ Permission granted")
    except lambda_client.exceptions.ResourceConflictException:
        print("⚠️  Permission already exists")
    
    print("\n" + "="*80)
    print("POST /contacts/validate ROUTE ADDED!")
    print("="*80)
    print("\nCSV import validation should now work!")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
