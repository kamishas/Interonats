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

def log(msg):
    print(msg)
    with open("debug_all_folders.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def get_token():
    try:
        with open(REFRESH_TOKEN_FILE, "r") as f:
            refresh_token = f.read().strip()
    except FileNotFoundError:
        log("refresh_token.txt not found!")
        return None

    params = {
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    resp = requests.post(AUTH_URL, params=params)
    if resp.status_code != 200:
        log(f"Token Error: {resp.text}")
        return None
    return resp.json().get("access_token")

def debug_folders():
    # Clear log
    with open("debug_all_folders.txt", "w", encoding="utf-8") as f: f.write("")
    
    token = get_token()
    if not token: return

    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    log("\n=== LISTING ALL FOLDERS ===")
    url = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/folders"
    resp = requests.get(url, headers=headers)
    
    if resp.status_code != 200:
        log(f"Error: {resp.status_code} {resp.text}")
        return

    data = resp.json().get("data", [])
    log(f"Found {len(data)} total folders.")
    
    for f in data:
        name = f.get("folderName")
        fid = f.get("folderId")
        path = f.get("path")
        log(f"Folder: {name} (ID: {fid}, Path: {path})")
        
        # Check count?
        # Note: Listing messages is expensive so we just do top 5 check
        url_msgs = f"{BASE_URL}/api/accounts/{ACCOUNT_ID}/folders/{fid}/messages?limit=10"
        r_msg = requests.get(url_msgs, headers=headers)
        if r_msg.status_code == 200:
            msgs = r_msg.json().get("data", [])
            log(f"  -> Check: Found {len(msgs)} messages:")
            for m in msgs:
                log(f"    - [{m.get('receivedTime')}] Subject: {m.get('subject')} | From: {m.get('fromAddress')}")
        else:
             log(f"  -> Error checking msgs: {r_msg.status_code}")

if __name__ == "__main__":
    debug_folders()
