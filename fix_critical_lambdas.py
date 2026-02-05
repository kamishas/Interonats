import boto3
import time

def fix_specific_targets():
    client = boto3.client('lambda', region_name='us-east-2')
    
    # These are the ones likely being hit by the API Gateway for /auth and /ai
    targets = ['ZohoAuthLambda', 'GenerateEmailLambda']
    
    with open('EmailAgentUnified.zip', 'rb') as f:
        zip_content = f.read()
        
    env_vars = {
        'ZOHO_CLIENT_ID': '1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC',
        'ZOHO_CLIENT_SECRET': '7523dc499deb78d76b88cd20771a509cbab00ce24b',
        'SOURCE_EMAIL': 'admin@onehr.com',
        'ZOHO_ACCOUNT_ID': 'primary'
    }

    for func in targets:
        print(f"--- Fixing {func} ---")
        try:
            # 1. Update Code
            print(f"Uploading Unified Code to {func}...")
            client.update_function_code(
                FunctionName=func,
                ZipFile=zip_content
            )
            
            # Wait loop for update to finish
            print("Waiting for update status...")
            while True:
                status = client.get_function(FunctionName=func)['Configuration']['LastUpdateStatus']
                if status == 'Successful':
                    break
                elif status == 'Failed':
                    raise Exception("Update Failed")
                time.sleep(1)
            
            # 2. Update Config
            print(f"Forcing Manual Router Configuration for {func}...")
            client.update_function_configuration(
                FunctionName=func,
                Handler='lambda_function.lambda_handler',
                Environment={'Variables': env_vars}
            )
            
            # Wait for config update
            while True:
                status = client.get_function(FunctionName=func)['Configuration']['LastUpdateStatus']
                if status == 'Successful':
                    break
                time.sleep(1)
                
            print(f"SUCCESS: {func} fixed.")
            
        except Exception as e:
            print(f"FAILED {func}: {e}")

if __name__ == '__main__':
    fix_specific_targets()
