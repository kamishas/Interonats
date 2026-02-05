import requests
import json

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

def list_inbox():
    token = get_token()
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    with open("inbox_log.txt", "w", encoding="utf-8") as f:
        # Try listing with folderId
        url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/messages?folderId={INBOX_ID}&limit=20"
        f.write(f"Request: {url}\n")
        
        resp = requests.get(url, headers=headers)
        f.write(f"Status: {resp.status_code}\n")
        
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            f.write(f"Found {len(data)} messages.\n")
            for m in data:
                line = f"[{m.get('receivedTime')}] {m.get('subject')} | {m.get('messageId')} | From: {m.get('fromAddress')}\n"
                f.write(line)
                print(line) 
        else:
            f.write(f"Error: {resp.text}\n")
            print(f"Error: {resp.status_code}")

if __name__ == "__main__":
    list_inbox()
