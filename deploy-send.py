import boto3
import shutil
import os
import time

def deploy():
    print("Fetching config...")
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    FUNC_NAME = "SendCampaignLambda"
    DIR = "lambda-functions/SendCampaignLambda"
    
    print(f"Zipping {DIR}...")
    shutil.make_archive("SendCampaignLambda", 'zip', DIR)
    
    print(f"Updating {FUNC_NAME} code...")
    with open("SendCampaignLambda.zip", 'rb') as f:
        zip_content = f.read()
        
    lambda_client.update_function_code(
        FunctionName=FUNC_NAME,
        ZipFile=zip_content
    )
    
    # Wait for update
    time.sleep(5)
    print(f"✅ {FUNC_NAME} Deployed Successfully!")

if __name__ == "__main__":
    deploy()
