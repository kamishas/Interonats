import json
import subprocess
import sys

def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr}"

try:
    # Try reading as utf-16 (default for PowerShell redirection on Windows)
    try:
        with open('campaign_resources.json', encoding='utf-16') as f:
            data = json.load(f)
    except:
        with open('campaign_resources.json', encoding='utf-8') as f:
            data = json.load(f)

    resource_id = None
    for item in data['items']:
        if item.get('path') == '/campaigns':
            resource_id = item['id']
            break
    
    if resource_id:
        print(f"Found Resource ID: {resource_id}")
        print("Checking POST method configuration...")
        
        cmd = f"aws apigateway get-method --rest-api-id 5cs5faz106 --resource-id {resource_id} --http-method POST --no-cli-pager"
        output = run_command(cmd)
        print(output)
        
    else:
        print("Resource /campaigns not found")

except Exception as e:
    print(f"Error parsing JSON: {e}")
