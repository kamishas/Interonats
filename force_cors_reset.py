import boto3
import time

def reset_cors():
    api_id = "5cs5faz106"
    resource_id = "84f7zl"
    region = "us-east-2"
    stage_name = "prod"
    
    client = boto3.client('apigateway', region_name=region)
    
    print(f"🔧 Resetting CORS for API: {api_id}, Resource: {resource_id}")
    
    # 1. Delete OPTIONS Method (if exists)
    try:
        client.delete_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS'
        )
        print("✅ Deleted existing OPTIONS method")
        time.sleep(2) # Wait for deletion to propagate
    except client.exceptions.NotFoundException:
        print("ℹ️ No existing OPTIONS method found")
    except Exception as e:
        print(f"⚠️ Error deleting method: {e}")

    # 2. Create OPTIONS Method (Mock)
    try:
        client.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
        print("✅ Created new OPTIONS method")
        
        client.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )
        print("✅ Created Mock Integration")
        
        # 3. Method Response
        client.put_method_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Origin': True
            }
        )
        print("✅ Configured Method Response headers")
        
        # 4. Integration Response (The important part!)
        client.put_integration_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
        print("✅ Configured Integration Response values (Wildcards)")
        
    except Exception as e:
        print(f"❌ Error setting up CORS: {e}")
        return

    # 5. Add CORS headers to POST method too (just in case)
    try:
        print("🔧 Updating POST method response headers...")
        client.update_method_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='POST',
            statusCode='200',
            patchOperations=[
                {
                    'op': 'add',
                    'path': '/responseParameters/method.response.header.Access-Control-Allow-Origin',
                    'value': 'true'
                }
            ]
        )
    except Exception as e:
        print(f"ℹ️ Could not update POST method response (might already exist): {e}")

    # 6. Deploy
    try:
        print("🚀 Deploying to 'prod'...")
        client.create_deployment(
            restApiId=api_id,
            stageName=stage_name,
            description=f"Force CORS Reset {int(time.time())}"
        )
        print("✅ API Deployed Successfully!")
    except Exception as e:
        print(f"❌ Error deploying: {e}")

if __name__ == "__main__":
    reset_cors()
