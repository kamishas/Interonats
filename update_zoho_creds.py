import boto3
import json

NEW_CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
NEW_CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"

try:
    with open('token.json', 'r') as f:
        data = json.load(f)
        REFRESH_TOKEN = data.get('refresh_token')
        
    if not REFRESH_TOKEN:
        print("❌ 'refresh_token' not found in token.json")
        exit(1)
        
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    FUNCTION_NAME = "SendCampaignLambda"

    print("Fetching current config...")
    conf = lambda_client.get_function_configuration(FunctionName=FUNCTION_NAME)
    env = conf['Environment']['Variables']

    # Update
    print(f"Old Client ID: {env.get('ZOHO_CLIENT_ID')}")
    print(f"Old Refresh Token: {env.get('ZOHO_REFRESH_TOKEN')[:10]}...")
    
    env['ZOHO_CLIENT_ID'] = NEW_CLIENT_ID
    env['ZOHO_CLIENT_SECRET'] = NEW_CLIENT_SECRET
    env['ZOHO_REFRESH_TOKEN'] = REFRESH_TOKEN

    print(f"Updating {FUNCTION_NAME} with new credentials...")
    lambda_client.update_function_configuration(
        FunctionName=FUNCTION_NAME,
        Environment={'Variables': env}
    )
    print("✅ Lambda Updated Successfully.")

except Exception as e:
    print(f"❌ Error: {e}")
