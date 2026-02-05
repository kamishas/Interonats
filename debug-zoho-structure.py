import requests
import json
import time

# Config
REFRESH_TOKEN_FILE = "refresh_token.txt"
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
BASE_URL = "https://mail.zoho.com"
AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"
ACCOUNT_ID = "566692000000008002"
INBOX_ID = "566692000000008014"

def get_token():
    try:
        with open(REFRESH_TOKEN_FILE, "r") as f:
            refresh_token = f.read().strip()
    except:
        return None

    params = {
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    resp = requests.post(AUTH_URL, params=params)
    if resp.status_code != 200:
        print(f"Token Error: {resp.text}")
        return None
    return resp.json().get("access_token")

def debug_structure():
    token = get_token()
    if not token: return
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    print("--- TEST 1: Base Messages List ---")
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/messages?limit=5"
    resp = requests.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print(f"Count: {len(resp.json().get('data', []))}")
    else:
        print(f"Error: {resp.text}")

    print("\n--- TEST 2: Messages with FolderId Params ---")
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/messages?folderId={INBOX_ID}&limit=5"
    resp = requests.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print(f"Count: {len(resp.json().get('data', []))}")
    else:
        print(f"Error: {resp.text}")

    print("\n--- TEST 3: Original Folder Path ---")
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/folders/{INBOX_ID}/messages?limit=5"
    resp = requests.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"Error: {resp.text}")

if __name__ == "__main__":
    debug_structure()
