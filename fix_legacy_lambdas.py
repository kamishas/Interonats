import boto3
import time

def fix_all():
    client = boto3.client('lambda', region_name='us-east-2')
    
    # functions to update with Unified Code
    targets = ['ZohoAuthLambda', 'GenerateEmailLambda']
    
    with open('EmailAgentUnified.zip', 'rb') as f:
        zip_content = f.read()

    for func in targets:
        print(f"--- Updating {func} ---")
        try:
            # 1. Update Code
            print("Uploading code...")
            client.update_function_code(
                FunctionName=func,
                ZipFile=zip_content
            )
            time.sleep(3) # wait for code update
            
            # 2. Update Config
            print("Updating handler configuration...")
            env_vars = {
                'ZOHO_CLIENT_ID': '1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC',
                'ZOHO_CLIENT_SECRET': '7523dc499deb78d76b88cd20771a509cbab00ce24b',
            }
            
            client.update_function_configuration(
                FunctionName=func,
                Handler='lambda_function.lambda_handler',
                Environment={'Variables': env_vars}
            )
            print(f"SUCCESS: {func} updated to Unified Code & Config.")
            
        except Exception as e:
            print(f"FAILED {func}: {e}")

if __name__ == '__main__':
    fix_all()
