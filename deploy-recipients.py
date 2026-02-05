import boto3
import shutil
import os
import time

def deploy():
    print("Fetching config...")
    # Just need basic update_function_code
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    FUNC_NAME = "ManageRecipientsLambda"
    DIR = "lambda-functions/ManageRecipientsLambda"
    
    print(f"Zipping {DIR}...")
    shutil.make_archive("ManageRecipientsLambda", 'zip', DIR)
    
    print(f"Updating {FUNC_NAME} code...")
    with open("ManageRecipientsLambda.zip", 'rb') as f:
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
