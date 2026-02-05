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
        return None
    return resp.json().get("access_token")

def poll_status():
    print("Starting IMAP Status Poll (Ctrl+C to stop)...")
    
    last_status = None
    
    for i in range(12): # Poll for 2 minutes (10s interval)
        token = get_token()
        if not token: break
        
        headers = {"Authorization": f"Zoho-oauthtoken {token}"}
        try:
            resp = requests.get(f"{BASE_URL}/api/accounts", headers=headers)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                if data:
                    acc = data[0]
                    enabled = acc.get("imapAccessEnabled")
                    print(f"[{i+1}] IMAP Enabled: {enabled}")
                    
                    if enabled is True:
                        print("\n✅ SUCCESS! IMAP is now ENABLED.")
                        print("You can verify the scanner now.")
                        return
            else:
                print(f"[{i+1}] Error: {resp.status_code}")
        except Exception as e:
            print(f"[{i+1}] Exception: {e}")
            
        time.sleep(10)

    print("\n⚠️ Timed out waiting for IMAP status to change.")

if __name__ == "__main__":
    poll_status()
