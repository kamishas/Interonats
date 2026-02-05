import imaplib
import requests

# Config
REFRESH_TOKEN_FILE = "refresh_token.txt"
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"
EMAIL_USER = "shasank.k@interonit.com"

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

def debug_imap():
    token = get_token()
    if not token:
        print("❌ FATAL: Could not get Access Token.")
        return
    print(f"Token obtained: {token[:10]}...")
    
    print(f"Connecting to imap.zoho.com for {EMAIL_USER}...")
    
    try:
        mail = imaplib.IMAP4_SSL("imap.zoho.com")
        
        # Build XOAUTH2 string
        # format: user={user}\x01auth=Bearer {token}\x01\x01
        variants = [
            f"user={EMAIL_USER}\x01auth=Bearer {token}\x01\x01",
            f"user={EMAIL_USER}\x01auth=Bearer {token}",
            f"user={EMAIL_USER}\x01auth=Bearer {token}\x01",
        ]
        
        for i, auth_v in enumerate(variants):
            print(f"--- Attempt {i+1} ---")
            try:
                # Re-connect for each attempt to be clean
                mail = imaplib.IMAP4_SSL("imap.zoho.com")
                mail.authenticate('XOAUTH2', lambda x: auth_v.encode('utf-8'))
                print("✅ Authenticated via IMAP!")
                mail.select("INBOX")
                # ... Code to search ...
                status, messages = mail.search(None, '(FROM "mailer-daemon")')
                if status == "OK":
                     print(f"Found {len(messages[0].split())} bounces.")
                mail.logout()
                print(f"🎉 SUCCESS with Variant {i+1}")
                return
            except Exception as e:
                print(f"Attempt {i+1} Failed: {e}")
        
        print("❌ All attempts failed.")
        
    except Exception as e:
        print(f"❌ IMAP Error: {e}")

if __name__ == "__main__":
    debug_imap()
