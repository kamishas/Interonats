import boto3
import time

def update_config():
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    NEW_CREDENTIALS = {
        "ZOHO_CLIENT_ID": "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC",
        "ZOHO_CLIENT_SECRET": "7523dc499deb78d76b88cd20771a509cbab00ce24b",
        "ZOHO_REFRESH_TOKEN": "1000.20ac09319b5935f9994118577b5b5284.2d008d32464b3833227332abcc18ece9",
        "ZOHO_ACCOUNT_ID": "566692000000008002", # Correct ID
        "ZOHO_BASE_URL": "https://mail.zoho.com"
    }
    
    funcs = ["BounceScannerLambda", "SendCampaignLambda"]
    
    for fname in funcs:
        print(f"Updating {fname} config...")
        
        # Get current config to preserve other vars
        resp = lambda_client.get_function_configuration(FunctionName=fname)
        current_env = resp['Environment']['Variables']
        
        # Update with new creds
        current_env.update(NEW_CREDENTIALS)
        
        lambda_client.update_function_configuration(
            FunctionName=fname,
            Environment={'Variables': current_env}
        )
        print("  -> Done.")
        time.sleep(1)

if __name__ == "__main__":
    update_config()
