import boto3

lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

print("="*80)
print("FIXING: ADDING API GATEWAY INVOKE PERMISSIONS")
print("="*80)

functions_to_fix = [
    'ListContactsLambda',
    'ListContactTagsLambda',
    'AddContactLambda',
    'ListCampaignsLambda',
    'CreateCampaignLambda',
    'GetCampaignLambda',
    'ConfigureCampaignLambda'
]

for func_name in functions_to_fix:
    print(f"\n{func_name}:")
    
    statement_id = f"apigateway-invoke-{func_name}"
    
    try:
        # Remove old permission if exists
        try:
            lambda_client.remove_permission(
                FunctionName=func_name,
                StatementId=statement_id
            )
            print(f"  Removed old permission")
        except:
            pass
        
        # Add new permission
        lambda_client.add_permission(
            FunctionName=func_name,
            StatementId=statement_id,
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*"
        )
        print(f"  ✅ Added API Gateway invoke permission")
        
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")

print(f"\n{'='*80}")
print("PERMISSIONS ADDED")
print("="*80)
