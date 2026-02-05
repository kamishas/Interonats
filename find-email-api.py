import boto3
import json

# Check which API Gateway has the email agent routes
client = boto3.client('apigatewayv2', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

print("=== Searching for Email Agent API Gateway ===\n")

# List all APIs
apis = client.get_apis()['Items']

for api in apis:
    api_id = api['ApiId']
    api_name = api['Name']
    endpoint = api.get('ApiEndpoint', 'N/A')
    
    print(f"API: {api_name}")
    print(f"  ID: {api_id}")
    print(f"  Endpoint: {endpoint}")
    
    # List routes
    try:
        routes = client.get_routes(ApiId=api_id)['Items']
        
        # Check if any routes match email agent patterns
        email_routes = [r for r in routes if any(keyword in r['RouteKey'].lower() 
                        for keyword in ['campaign', 'compliance', 'image', 'contact', 'send'])]
        
        if email_routes:
            print(f"  ⭐ FOUND EMAIL AGENT ROUTES ({len(email_routes)}):")
            for route in email_routes:
                print(f"    - {route['RouteKey']}")
                # Check integration
                if 'Target' in route:
                    print(f"      Target: {route['Target']}")
            print()
    except Exception as e:
        print(f"  Error: {e}\n")

print("\n=== Checking SendCampaignLambda Triggers ===")
try:
    func = lambda_client.get_function(FunctionName='SendCampaignLambda')
    print(f"Function ARN: {func['Configuration']['FunctionArn']}")
    
    # Check triggers
    policy = lambda_client.get_policy(FunctionName='SendCampaignLambda')
    policy_doc = json.loads(policy['Policy'])
    print(f"\nPermissions ({len(policy_doc['Statement'])}):")
    for stmt in policy_doc['Statement']:
        if 'Condition' in stmt and 'ArnLike' in stmt['Condition']:
            source_arn = stmt['Condition']['ArnLike'].get('AWS:SourceArn', 'N/A')
            print(f"  - {source_arn}")
except Exception as e:
    print(f"Error: {e}")
