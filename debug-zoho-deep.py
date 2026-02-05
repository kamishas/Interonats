import requests
import json
import time

# Config
REFRESH_TOKEN_FILE = "refresh_token.txt"
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
BASE_URL = "https://mail.zoho.com"
AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"

def get_token():
    try:
        with open(REFRESH_TOKEN_FILE, "r") as f:
            refresh_token = f.read().strip()
    except FileNotFoundError:
        print("refresh_token.txt not found!")
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

def log(msg):
    print(msg)
    with open("debug_log.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def debug_deep():
    # Clear log
    with open("debug_log.txt", "w", encoding="utf-8") as f: f.write("")
    
    token = get_token()
    if not token: return

    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    log("\n=== 1. FETCHING ACCOUNT METADATA ===")
    url = f"{BASE_URL}/api/accounts"
    resp = requests.get(url, headers=headers)
    
    # PRINT RAW RESPONSE
    log(f"Status: {resp.status_code}")
    try:
        json_data = resp.json()
        log(f"Raw JSON: {json.dumps(json_data, indent=2)}")
        
        data = json_data.get("data")
        if not data:
            log("No 'data' field in response")
            return
            
        if isinstance(data, list):
            account = data[0]
            acc_id = account.get("accountId")
        else:
             log("Data is not a list")
             return

    except Exception as e:
        log(f"Error parsing JSON: {e}")
        return

    log("\n=== 2. SCANNING SENT FOLDER ===")
    url_folders = f"{BASE_URL}/api/accounts/{acc_id}/folders"
    resp_folders = requests.get(url_folders, headers=headers)
    
    # Safe Get
    try:
        folders_data = resp_folders.json().get("data", [])
    except:
        log(f"Folder Error: {resp_folders.text}")
        folders_data = []

    sent_id = None
    inbox_id = None
    
    for f in folders_data:
        name = f.get("folderName")
        fid = f.get("folderId")
        log(f"Found Folder: {name} ({fid})")
        
        if name == "Sent": sent_id = fid
        if name == "Inbox": inbox_id = fid

    log(f"\nScanning Sent ({sent_id})...")
    if sent_id:
        url_sent = f"{BASE_URL}/api/accounts/{acc_id}/folders/{sent_id}/messages?limit=5"
        resp_sent = requests.get(url_sent, headers=headers)
        if resp_sent.status_code == 200:
             msgs = resp_sent.json().get("data", [])
             log(f"Messages found: {len(msgs)}")
             for m in msgs:
                 log(f" - [SENT] {m.get('subject')}")
        else:
             log(f"Error listing sent: {resp_sent.text}")

if __name__ == "__main__":
    debug_deep()
