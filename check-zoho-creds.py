import boto3
import json

lambda_client = boto3.client('lambda', region_name='us-east-2')

# Get environment variables only
func = lambda_client.get_function(FunctionName='SendCampaignLambda')
env_vars = func['Configuration'].get('Environment', {}).get('Variables', {})

print("=== Zoho Credentials Check ===\n")

zoho_keys = {
    'ZOHO_CLIENT_ID': 'Client ID for Zoho OAuth',
    'ZOHO_CLIENT_SECRET': 'Client Secret for Zoho OAuth',
    'ZOHO_REFRESH_TOKEN': 'Refresh Token (permanent)',
    'ZOHO_ACCOUNT_ID': 'Zoho Mail Account ID',
    'SOURCE_EMAIL': 'From email address',
    'ZOHO_BASE_URL': 'Zoho Mail API base URL'
}

missing = []
for key, desc in zoho_keys.items():
    if key in env_vars:
        value = env_vars[key]
        if 'SECRET' in key or 'TOKEN' in key:
            masked = value[:6] + '...' + value[-4:] if len(value) > 10 else '***'
            print(f"✅ {key}")
            print(f"   {desc}")
            print(f"   Value: {masked}\n")
        else:
            print(f"✅ {key}")
            print(f"   {desc}")
            print(f"   Value: {value}\n")
    else:
        print(f"❌ {key} - MISSING")
        print(f"   {desc}\n")
        missing.append(key)

if missing:
    print(f"\n⚠️  Missing {len(missing)} credential(s): {', '.join(missing)}")
    print("\nTo fix, run:")
    print("aws lambda update-function-configuration --function-name SendCampaignLambda --region us-east-2 \\")
    print("  --environment Variables='{")
    for key in missing:
        print(f'    "{key}": "YOUR_VALUE_HERE",')
    print("  }'")
else:
    print("\n✅ All Zoho credentials are configured!")

print("\n=== Other Environment Variables ===")
for key, value in env_vars.items():
    if key not in zoho_keys:
        print(f"{key}: {value}")
