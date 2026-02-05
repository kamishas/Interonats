import requests
import zipfile
import io
import os

try:
    # Handle PowerShell UTF-16 encoding
    try:
        with open('create_lambda_url.txt', 'r', encoding='utf-16') as f:
            url = f.read().strip()
    except:
        with open('create_lambda_url.txt', 'r', encoding='utf-8') as f:
            url = f.read().strip()
    
    # Remove any BOM or hidden characters
    url = url.replace('\ufeff', '').strip()
    
    print(f"Downloading from: {url[:50]}...")
    r = requests.get(url)
    z = zipfile.ZipFile(io.BytesIO(r.content))
    
    os.makedirs('create_lambda_code', exist_ok=True)
    z.extractall('create_lambda_code')
    print("Extracted to create_lambda_code/")
    
    # List files
    for root, dirs, files in os.walk('create_lambda_code'):
        for file in files:
            print(f"File: {file}")

except Exception as e:
    print(f"Error: {e}")
