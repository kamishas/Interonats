import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
API_ID = '5tdsq6s7h3'

print("="*80)
print("CREATING/UPDATING $default STAGE")
print("="*80)

try:
    # Check if $default stage exists
    stages = apigateway.get_stages(ApiId=API_ID)
    default_exists = any(s['StageName'] == '$default' for s in stages['Items'])
    
    if default_exists:
        print("✅ $default stage exists")
        # Update to enable auto-deploy
        apigateway.update_stage(
            ApiId=API_ID,
            StageName='$default',
            AutoDeploy=True
        )
        print("✅ Enabled auto-deploy on $default stage")
    else:
        print("⚠️  $default stage doesn't exist - creating it...")
        apigateway.create_stage(
            ApiId=API_ID,
            StageName='$default',
            AutoDeploy=True
        )
        print("✅ Created $default stage with auto-deploy")
    
    # Create a new deployment
    deployment = apigateway.create_deployment(
        ApiId=API_ID,
        StageName='$default',
        Description='Deploy all routes'
    )
    print(f"✅ Deployed to $default stage")
    print(f"   Deployment ID: {deployment['DeploymentId']}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "="*80)
