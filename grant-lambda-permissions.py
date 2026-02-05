import boto3

lambda_client = boto3.client('lambda', region_name='us-east-2')

API_ID = '5tdsq6s7h3'
REGION = 'us-east-2'
ACCOUNT_ID = '397753625517'

lambdas_to_grant = [
    'ManageRecipientsLambda',
    'ConfigureCampaignLambda'
]

print("="*80)
print("GRANTING API GATEWAY INVOKE PERMISSIONS")
print("="*80)

for lambda_name in lambdas_to_grant:
    print(f"\n{lambda_name}:")
    try:
        lambda_client.add_permission(
            FunctionName=lambda_name,
            StatementId=f'apigateway-invoke-{lambda_name}',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*"
        )
        print(f"  ✅ Permission granted")
    except lambda_client.exceptions.ResourceConflictException:
        print(f"  ⚠️  Permission already exists")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")

print(f"\n{'='*80}")
print("PERMISSIONS GRANTED!")
print("="*80)
