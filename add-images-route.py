import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("ADDING POST /images ROUTE FOR IMAGE COMPLIANCE")
print("="*80)

# Check if ImageUploadLambda or ImageComplianceLambda exists
lambda_name = None
for name in ['ImageUploadLambda', 'ImageComplianceLambda', 'ImageCheckLambda']:
    try:
        lambda_client.get_function(FunctionName=name)
        lambda_name = name
        print(f"✅ Found Lambda function: {lambda_name}")
        break
    except:
        pass

if not lambda_name:
    print("❌ No image Lambda function found!")
    print("   Need to create ImageUploadLambda or ImageComplianceLambda first")
    exit(1)

lambda_arn = f"arn:aws:lambda:{REGION}:{ACCOUNT_ID}:function:{lambda_name}"

try:
    # Create integration
    print(f"\n1. Creating Lambda integration for {lambda_name}...")
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
    print("\n2. Creating POST /images route...")
    route = apigateway.create_route(
        ApiId=API_ID,
        RouteKey='POST /images',
        Target=f"integrations/{integration['IntegrationId']}"
    )
    print(f"✅ Route created: {route['RouteId']}")
    
    # Grant permission
    print("\n3. Granting Lambda invoke permission...")
    try:
        lambda_client.add_permission(
            FunctionName=lambda_name,
            StatementId='apigateway-post-images',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*"
        )
        print("✅ Permission granted")
    except lambda_client.exceptions.ResourceConflictException:
        print("⚠️  Permission already exists")
    
    print("\n" + "="*80)
    print("POST /images ROUTE ADDED!")
    print("="*80)
    print("\nImage compliance checking should now work!")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
