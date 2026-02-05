import json
import boto3
import requests

lambda_client = boto3.client('lambda', region_name='us-east-2')

def list_folders():
    print("Fetching credentials from SendCampaignLambda...")
    resp = lambda_client.get_function_configuration(FunctionName='SendCampaignLambda')
    env = resp['Environment']['Variables']
    
    CLIENT_ID = env.get('ZOHO_CLIENT_ID')
    CLIENT_SECRET = env.get('ZOHO_CLIENT_SECRET')
    REFRESH_TOKEN = env.get('ZOHO_REFRESH_TOKEN')
    ACCOUNT_ID = env.get('ZOHO_ACCOUNT_ID')
    BASE_URL = env.get('ZOHO_BASE_URL', 'https://mail.zoho.com')
    
    print(f"Refreshing Token (Base: {BASE_URL})...")
    token_url = f"https://accounts.zoho.com/oauth/v2/token"
    token_params = {
        "refresh_token": REFRESH_TOKEN,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    # use data for POST body
    r = requests.post(token_url, data=token_params)
    if r.status_code != 200:
        print(f"Token Error: {r.text}")
        return
    token = r.json()['access_token']
    
    print("\n--- Listing Folders ---")
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/folders"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    r = requests.get(url, headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json().get('data', [])
        print(f"Folders Found: {len(data)}")
        for f in data:
            print(f" - {f.get('folderName')} (ID: {f.get('folderId')})")
    else:
        print(f"API Error: {r.text}")

if __name__ == "__main__":
    list_folders()
