# Fix API Gateway to Use Correct Account

import boto3

apigateway = boto3.client('apigatewayv2', region_name='us-east-2')
sts = boto3.client('sts')

# Get current account ID
identity = sts.get_caller_identity()
ACCOUNT_ID = identity['Account']

print(f"Current AWS Account: {ACCOUNT_ID}")

API_ID = '5tdsq6s7h3'

print(f"\nUpdating API Gateway {API_ID} to use account {ACCOUNT_ID}...")

# The issue is that configure-all-routes.py used hardcoded account 397753625517
# But Lambda functions are in the current account
# We need to update the integration URIs

print("\n✅ Solution: Redeploy Lambda functions with correct account in API Gateway")
print(f"   Run: python configure-all-routes-fixed.py")
