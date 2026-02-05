import requests
import json

# Config
REFRESH_TOKEN_FILE = "refresh_token.txt"
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
BASE_URL = "https://mail.zoho.com"
AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"
ACCOUNT_ID = "566692000000008002"
ZUID = "904979138" # From deep debug

def get_token():
    try:
        with open(REFRESH_TOKEN_FILE, "r") as f:
            refresh_token = f.read().strip()
    except: return None
    params = {
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    resp = requests.post(AUTH_URL, params=params)
    if resp.status_code != 200: return None
    return resp.json().get("access_token")

def debug_zuid():
    token = get_token()
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    print("--- TEST A: Using ZUID ---")
    url = f"{BASE_URL}/api/accounts/{ZUID}/messages?limit=5"
    resp = requests.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200: print(resp.text)

    print("\n--- TEST B: No ID (Inferred) ---")
    url2 = f"{BASE_URL}/api/accounts/messages?limit=5"
    resp2 = requests.get(url2, headers=headers)
    print(f"Status: {resp2.status_code}")
    if resp2.status_code != 200: print(resp2.text)

if __name__ == "__main__":
    debug_zuid()
