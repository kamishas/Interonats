import boto3
import urllib.request
import zipfile
import os

def download_lambda():
    client = boto3.client('lambda', region_name='us-east-2')
    print("Getting function URL...")
    response = client.get_function(FunctionName='onehr-login-api')
    url = response['Code']['Location']
    
    print("Downloading zip...")
    urllib.request.urlretrieve(url, 'onehr-login-api.zip')
    
    print("Unzipping...")
    with zipfile.ZipFile('onehr-login-api.zip', 'r') as zip_ref:
        zip_ref.extractall('onehr-login-api')
        
    print("Done. Extracted to onehr-login-api/")

if __name__ == '__main__':
    download_lambda()
