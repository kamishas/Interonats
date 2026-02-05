import boto3
import shutil
import os
import time

def deploy():
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    # 1. Zip
    print("Zipping EmailAgentUnified...")
    # UPDATED PATH to match where code edits are happening
    base_dir = os.path.abspath("OneHR 2.0 for Email/lambda-functions/EmailAgentUnified")
    output_filename = "EmailAgentUnified"
    shutil.make_archive(output_filename, 'zip', base_dir)
    print(f"Created {output_filename}.zip")
    
    with open(f"{output_filename}.zip", 'rb') as f:
        zip_content = f.read()

    # 2. Get Role
    print("Fetching Role ARN...")
    role_arn = lambda_client.get_function_configuration(FunctionName='ListContactsLambda')['Role']
    print(f"Role: {role_arn}")
    
    # 3. Create or Update
    func_name = 'EmailAgentUnified'
    
    try:
        print(f"Checking if {func_name} exists...")
        lambda_client.get_function(FunctionName=func_name)
        print("Function exists. Updating code...")
        lambda_client.update_function_code(
            FunctionName=func_name,
            ZipFile=zip_content
        )
        print("Waiting for code update to propagate...")
        time.sleep(5)
        
        print("Updating function configuration (Handler & Env)...")
        lambda_client.update_function_configuration(
            FunctionName=func_name,
            Handler='lambda_function.lambda_handler',
            Environment={
                'Variables': {
                    'ZOHO_CLIENT_ID': os.environ.get('ZOHO_CLIENT_ID', ''), 
                    'ZOHO_CLIENT_SECRET': os.environ.get('ZOHO_CLIENT_SECRET', ''),
                    'SOURCE_EMAIL': os.environ.get('SOURCE_EMAIL', ''),
                    'ZOHO_ACCOUNT_ID': os.environ.get('ZOHO_ACCOUNT_ID', '')
                }
            }
        )
    except lambda_client.exceptions.ResourceNotFoundException:
        print("Function does not exist. Creating...")
        lambda_client.create_function(
            FunctionName=func_name,
            Runtime='python3.9', # Using 3.9 as 3.11 might not represent local env perfectly, or safer default
            Role=role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_content},
            Timeout=30, # Increased timeout for Zoho/SMTP
            MemorySize=512,
            Environment={
                'Variables': {
                    'ZOHO_CLIENT_ID': os.environ.get('ZOHO_CLIENT_ID', ''), # Pass from local env if available or empty
                    'ZOHO_CLIENT_SECRET': os.environ.get('ZOHO_CLIENT_SECRET', ''),
                    'SOURCE_EMAIL': os.environ.get('SOURCE_EMAIL', ''),
                    'ZOHO_ACCOUNT_ID': os.environ.get('ZOHO_ACCOUNT_ID', '')
                }
            }
        )
    
    print("Deployment initiated. Waiting for update...")
    time.sleep(5)
    print("Done!")

if __name__ == "__main__":
    deploy()
