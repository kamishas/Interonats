import shutil
import os
import subprocess

def zip_and_deploy(folder, function_name, zip_name):
    print(f"--- Deploying {function_name} ---")
    
    # Create zip file
    print(f"Zipping {folder}...")
    shutil.make_archive(zip_name.replace('.zip', ''), 'zip', folder)
    
    # Deploy
    print(f"Uploading {zip_name} to AWS Lambda...")
    cmd = f"aws lambda update-function-code --function-name {function_name} --zip-file fileb://{zip_name} --no-cli-pager"
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print("Deployment Successful!")
    except subprocess.CalledProcessError as e:
        print(f"Deployment Failed: {e.stderr}")

# Deploy ListCampaignsLambda
zip_and_deploy('list_lambda_code', 'ListCampaignsLambda', 'list_campaigns.zip')
