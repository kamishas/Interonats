import boto3
import json

lambda_client = boto3.client('lambda', region_name='us-east-2')

print("=== SendCampaignLambda Status ===\n")

try:
    # Get function configuration
    func = lambda_client.get_function(FunctionName='SendCampaignLambda')
    config = func['Configuration']
    
    print(f"Function Name: {config['FunctionName']}")
    print(f"Runtime: {config['Runtime']}")
    print(f"Last Modified: {config['LastModified']}")
    print(f"Memory: {config['MemorySize']} MB")
    print(f"Timeout: {config['Timeout']} seconds")
    
    print("\n=== Environment Variables ===")
    env_vars = config.get('Environment', {}).get('Variables', {})
    
    # Check for Zoho credentials
    zoho_keys = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 
                 'ZOHO_ACCOUNT_ID', 'SOURCE_EMAIL']
    
    for key in zoho_keys:
        if key in env_vars:
            # Mask sensitive values
            value = env_vars[key]
            if 'SECRET' in key or 'TOKEN' in key:
                masked = value[:4] + '***' + value[-4:] if len(value) > 8 else '***'
                print(f"✅ {key}: {masked}")
            else:
                print(f"✅ {key}: {value}")
        else:
            print(f"❌ {key}: NOT SET")
    
    # Check other env vars
    print("\n=== Other Environment Variables ===")
    for key, value in env_vars.items():
        if key not in zoho_keys:
            print(f"{key}: {value}")
    
    # Check if function has API Gateway trigger
    print("\n=== Checking Triggers ===")
    try:
        policy = lambda_client.get_policy(FunctionName='SendCampaignLambda')
        policy_doc = json.loads(policy['Policy'])
        
        print(f"Permissions: {len(policy_doc['Statement'])}")
        for stmt in policy_doc['Statement']:
            if 'Condition' in stmt:
                source_arn = stmt.get('Condition', {}).get('ArnLike', {}).get('AWS:SourceArn', 'N/A')
                print(f"  - {source_arn}")
    except Exception as e:
        print(f"No resource policy found: {e}")
        
except Exception as e:
    print(f"❌ Error: {e}")
