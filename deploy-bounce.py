import boto3
import shutil
import os
import time

def deploy():
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    # 1. Get Config from SendCampaignLambda
    print("Fetching config from SendCampaignLambda...")
    ref_conf = lambda_client.get_function_configuration(FunctionName='SendCampaignLambda')
    role_arn = ref_conf['Role']
    env_vars = ref_conf['Environment']['Variables']
    
    # Inject App Password and Email
    env_vars['ZOHO_APP_PASSWORD'] = "F6JgJER5n9uc"
    env_vars['ZOHO_EMAIL'] = "shasank.k@interonit.com"
    
    FUNC_NAME = "BounceScannerLambda"
    
    # 2. Zip
    print("Zipping...")
    base_dir = "lambda-functions/BounceScannerLambda"
    shutil.make_archive("bounce_lambda", 'zip', base_dir)
    
    # 3. Check if exists
    try:
        lambda_client.get_function(FunctionName=FUNC_NAME)
        exists = True
    except:
        exists = False
        
    with open("bounce_lambda.zip", 'rb') as f:
        zip_content = f.read()
        
    if exists:
        print(f"Updating {FUNC_NAME} code...")
        lambda_client.update_function_code(
            FunctionName=FUNC_NAME,
            ZipFile=zip_content
        )
        print("Waiting for update...")
        time.sleep(2)
        print("Updating Configuration...")
        lambda_client.update_function_configuration(
            FunctionName=FUNC_NAME,
            Environment={'Variables': env_vars},
            Timeout=60 # Give it time to scan
        )
    else:
        print(f"Creating {FUNC_NAME}...")
        lambda_client.create_function(
            FunctionName=FUNC_NAME,
            Runtime='python3.11',
            Role=role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_content},
            Environment={'Variables': env_vars},
            Timeout=60
        )
        
    print(f"✅ {FUNC_NAME} Deployed Successfully!")

if __name__ == "__main__":
    deploy()
