import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
API_ID = '5tdsq6s7h3'

print("="*80)
print("DEPLOYING API GATEWAY")
print("="*80)

# API Gateway changes need to be deployed to take effect!
try:
    response = apigateway.create_deployment(
        ApiId=API_ID,
        Description='Deploy all route changes'
    )
    
    print(f"✅ API Gateway deployed successfully!")
    print(f"   Deployment ID: {response['DeploymentId']}")
    print(f"\n⚠️  THIS WAS THE ISSUE - Changes weren't deployed!")
    print(f"\nAll route changes are now live.")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "="*80)
