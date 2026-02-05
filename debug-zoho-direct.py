import requests
import json
import time

# Config
REFRESH_TOKEN_FILE = "refresh_token.txt"
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
ACCOUNT_ID = "566692000000008002"
BASE_URL = "https://mail.zoho.com"

def get_token():
    try:
        with open(REFRESH_TOKEN_FILE, "r") as f:
            refresh_token = f.read().strip()
    except FileNotFoundError:
        print("refresh_token.txt not found!")
        return None

    import urllib.parse
    base_auth_url = "https://accounts.zoho.com/oauth/v2/token"
    params = {
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    # Match Lambda behavior: verify if it sends as params string
    resp = requests.post(base_auth_url, params=params) # params= puts in Query String
    if resp.status_code != 200:
        print(f"Token Error: {resp.text}")
        return None
    return resp.json().get("access_token")

def debug_api():
    token = get_token()
    if not token: return

    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    print("\n--- 1. Get Account Info ---")
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}"
    resp = requests.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text[:500]}")

    print("\n--- 2. List Folders (Expect 401?) ---")
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/folders"
    resp = requests.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text[:500]}")

    print("\n--- 3. Search Messages (Check Path) ---")
    # Try alternate path?
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/messages/search?searchKey=subject:Undelivered" 
    resp = requests.get(url, headers=headers)
    print(f"Status (messages/search): {resp.status_code}")
    
    url2 = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/messages?searchKey=subject:Undelivered"
    resp = requests.get(url2, headers=headers)
    print(f"Status (messages?searchKey): {resp.status_code}")
    print(f"Body: {resp.text[:500]}")

if __name__ == "__main__":
    debug_api()
