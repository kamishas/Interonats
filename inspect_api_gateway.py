import boto3
import json

api_client = boto3.client('apigateway', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5cs5faz106'
RESOURCE_ID = None

# 1. Find Resource ID for /util/verify-address
print("Looking for /util/verify-address...")
try:
    resources = api_client.get_resources(restApiId=API_ID)
    for item in resources['items']:
        if item.get('path') == '/util/verify-address':
            RESOURCE_ID = item['id']
            break
            
    print(f"Resource ID: {RESOURCE_ID}")

    if RESOURCE_ID:
        # 2. Get Integration
        try:
            integration = api_client.get_integration(
                restApiId=API_ID,
                resourceId=RESOURCE_ID,
                httpMethod='POST'
            )
            print("Integration Query Result:")
            print(f"Type: {integration.get('type')}")
            print(f"URI: {integration.get('uri')}")
        except Exception as e:
            print(f"Get Integration Error: {e}")

    # 3. Get Lambda Policy
    try:
        policy = lambda_client.get_policy(FunctionName='AddressVerificationLambda')
        print("\nLambda Policy:")
        print(json.dumps(json.loads(policy['Policy']), indent=2))
    except Exception as e:
        print(f"Policy Error: {e}")
        
except Exception as e:
    print(f"General Error: {e}")
