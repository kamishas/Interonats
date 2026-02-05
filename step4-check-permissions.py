import boto3

lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("STEP 4: CHECKING LAMBDA INVOKE PERMISSIONS")
print("="*80)

functions_to_check = [
    'ListContactsLambda',
    'ListContactTagsLambda',
    'ListCampaignsLambda'
]

for func_name in functions_to_check:
    print(f"\n{'='*80}")
    print(f"Function: {func_name}")
    print("="*80)
    
    try:
        # Get function policy
        policy_response = lambda_client.get_policy(FunctionName=func_name)
        policy = policy_response['Policy']
        policy_json = eval(policy)  # Convert string to dict
        
        statements = policy_json.get('Statement', [])
        
        # Check for API Gateway permission
        has_apigw_permission = False
        for statement in statements:
            principal = statement.get('Principal', {})
            if isinstance(principal, dict) and principal.get('Service') == 'apigateway.amazonaws.com':
                has_apigw_permission = True
                print(f"✅ Has API Gateway invoke permission")
                print(f"   Statement ID: {statement.get('Sid')}")
                break
        
        if not has_apigw_permission:
            print(f"❌ NO API Gateway invoke permission")
            print(f"   This Lambda cannot be invoked by API Gateway!")
            
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"❌ No resource policy found")
        print(f"   Lambda has no invoke permissions!")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

print(f"\n{'='*80}")
