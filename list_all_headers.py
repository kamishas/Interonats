import json
import boto3
import requests

lambda_client = boto3.client('lambda', region_name='us-east-2')

def list_headers():
    print("Fetching credentials...")
    resp = lambda_client.get_function_configuration(FunctionName='BounceScannerLambda')
    env = resp['Environment']['Variables']
    
    CLIENT_ID = env.get('ZOHO_CLIENT_ID')
    CLIENT_SECRET = env.get('ZOHO_CLIENT_SECRET')
    REFRESH_TOKEN = env.get('ZOHO_REFRESH_TOKEN')
    ACCOUNT_ID = env.get('ZOHO_ACCOUNT_ID')
    
    print("Refreshing Token...")
    token_url = f"https://accounts.zoho.com/oauth/v2/token"
    token_params = {
        "refresh_token": REFRESH_TOKEN,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    r = requests.post(token_url, params=token_params)
    if r.status_code != 200:
        print(f"Token Failed: {r.text}")
        return
    token = r.json()['access_token']
    
    print("\n--- Listing Inbox ---")
    url = f"https://mail.zoho.com/api/accounts/{ACCOUNT_ID}/messages"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    params = {"limit": 20, "sortorder": "desc"} # No SearchKey
    
    r = requests.get(url, headers=headers, params=params)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json().get('data', [])
        print(f"Messages Found: {len(data)}")
        for m in data:
            print(f"[{m.get('receivedTime')}] From: {m.get('sender')} | Sub: {m.get('subject')}")
    else:
        print(f"API Error: {r.text}")

if __name__ == "__main__":
    list_headers()
