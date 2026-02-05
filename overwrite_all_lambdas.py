import boto3
import os
import time

def update_all_lambdas():
    client = boto3.client('lambda', region_name='us-east-2')
    
    # List of all directories that look like lambdas
    lambda_dir = r"lambda-functions"
    all_dirs = [d for d in os.listdir(lambda_dir) if os.path.isdir(os.path.join(lambda_dir, d))]
    
    # Exclude the source itself to avoid redundancy, though it doesn't hurt
    # We want to update EVERYTHING else.
    
    with open('EmailAgentUnified.zip', 'rb') as f:
        zip_content = f.read()
        
    env_vars = {
        'ZOHO_CLIENT_ID': '1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC',
        'ZOHO_CLIENT_SECRET': '7523dc499deb78d76b88cd20771a509cbab00ce24b',
        'SOURCE_EMAIL': 'admin@onehr.com',
        'ZOHO_ACCOUNT_ID': 'primary'
    }

    print(f"Found {len(all_dirs)} functions to potential update.")
    
    for func_name in all_dirs:
        # Skip utility folders if any
        if func_name in ['__pycache__', 'layers']: continue
        
        print(f"--- Processing {func_name} ---")
        
        try:
            # Check if function exists in AWS
            try:
                client.get_function(FunctionName=func_name)
            except client.exceptions.ResourceNotFoundException:
                print(f"Skipping {func_name} (Not found in AWS)")
                continue
                
            print(f"Updating Code for {func_name}...")
            client.update_function_code(
                FunctionName=func_name,
                ZipFile=zip_content
            )
            time.sleep(1) # throttline
            
            print(f"Updating Config for {func_name}...")
            client.update_function_configuration(
                FunctionName=func_name,
                Handler='lambda_function.lambda_handler',
                Environment={'Variables': env_vars}
            )
            print("SUCCESS.")
            
        except Exception as e:
            print(f"Error updating {func_name}: {e}")
            
if __name__ == '__main__':
    update_all_lambdas()
