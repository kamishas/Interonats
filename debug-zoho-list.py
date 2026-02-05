import json
import boto3
import requests

lambda_client = boto3.client('lambda', region_name='us-east-2')

def list_recent_emails():
    print("Fetching credentials...")
    resp = lambda_client.get_function_configuration(FunctionName='BounceScannerLambda')
    env = resp['Environment']['Variables']
    
    CLIENT_ID = env.get('ZOHO_CLIENT_ID')
    CLIENT_SECRET = env.get('ZOHO_CLIENT_SECRET')
    REFRESH_TOKEN = env.get('ZOHO_REFRESH_TOKEN')
    ACCOUNT_ID = env.get('ZOHO_ACCOUNT_ID')
    
    # Refresh Token
    print("Refreshing Token...")
    token_url = f"https://accounts.zoho.com/oauth/v2/token"
    token_params = {
        "refresh_token": REFRESH_TOKEN,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    r = requests.post(token_url, params=token_params)
    token = r.json()['access_token']
    
    # Search 1: mailer-daemon
    print("\n--- Searching from:mailer-daemon ---")
    url = f"https://mail.zoho.com/api/accounts/{ACCOUNT_ID}/messages"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    params = {"searchKey": "from:mailer-daemon", "limit": 5}
    
    r = requests.get(url, headers=headers, params=params)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json().get('data', [])
        print(f"Found: {len(data)}")
        for m in data:
            print(f" - {m.get('sender')} | {m.get('subject')}")
            
    # Search 2: subject:Undelivered
    print("\n--- Searching subject:Undelivered ---")
    params = {"searchKey": "subject:Undelivered", "limit": 5}
    r = requests.get(url, headers=headers, params=params)
    if r.status_code == 200:
        data = r.json().get('data', [])
        print(f"Found: {len(data)}")
        for m in data:
            print(f" - {m.get('sender')} | {m.get('subject')}")

if __name__ == "__main__":
    list_recent_emails()
