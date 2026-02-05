import requests
import json

REFRESH_TOKEN_FILE = "refresh_token.txt"
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"

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

def debug_profile():
    token = get_token()
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # Get Accounts
    url = "https://mail.zoho.com/api/accounts"
    resp = requests.get(url, headers=headers)
    
    print(f"Status: {resp.status_code}")
    with open("profile_data.json", "w") as f:
        f.write(resp.text)
    print("Saved to profile_data.json")

if __name__ == "__main__":
    debug_profile()
