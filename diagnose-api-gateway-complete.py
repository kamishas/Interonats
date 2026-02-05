import boto3
import json

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
API_ID = '5tdsq6s7h3'

print("="*80)
print("COMPLETE API GATEWAY DIAGNOSIS")
print("="*80)

# Get API details
api = apigateway.get_api(ApiId=API_ID)
print(f"\nAPI Name: {api['Name']}")
print(f"API Endpoint: {api['ApiEndpoint']}")
print(f"Protocol: {api['ProtocolType']}")

# Check stages
print("\n" + "="*80)
print("STAGES")
print("="*80)
stages = apigateway.get_stages(ApiId=API_ID)
print(f"Total stages: {len(stages['Items'])}")
for stage in stages['Items']:
    print(f"\n  Stage: {stage['StageName']}")
    print(f"    Auto Deploy: {stage.get('AutoDeploy', False)}")
    print(f"    Created: {stage.get('CreatedDate')}")
    if 'DeploymentId' in stage:
        print(f"    Deployment ID: {stage['DeploymentId']}")

# Check if we need a default stage
if not stages['Items']:
    print("\n⚠️  NO STAGES FOUND - This might be the issue!")
    print("   HTTP APIs need a $default stage")

# Get routes
print("\n" + "="*80)
print("ROUTES")
print("="*80)
routes = apigateway.get_routes(ApiId=API_ID)
contact_routes = [r for r in routes['Items'] if 'contact' in r.get('RouteKey', '').lower()]

for route in contact_routes:
    print(f"\n  {route['RouteKey']}")
    print(f"    Route ID: {route['RouteId']}")
    print(f"    Target: {route.get('Target', 'NO TARGET')}")

print("\n" + "="*80)
