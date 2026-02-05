import boto3
import shutil
import os
import zipfile

def deploy_login():
    lambda_name = 'onehr-login-api'
    source_dir = 'onehr-login-api'
    zip_file = 'onehr-login-api-deploy.zip'
    
    print(f"Zipping {source_dir}...")
    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                if '__pycache__' in root or file.endswith('.pyc') or file == '.env':
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
                
    print(f"Updating Lambda {lambda_name}...")
    client = boto3.client('lambda', region_name='us-east-2')
    with open(zip_file, 'rb') as f:
        response = client.update_function_code(
            FunctionName=lambda_name,
            ZipFile=f.read()
        )
        
    print(f"Update status: {response['LastUpdateStatus']}")

if __name__ == '__main__':
    deploy_login()
