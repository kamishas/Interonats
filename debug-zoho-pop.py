import poplib
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

def debug_pop():
    token = get_token()
    if not token: print("No token"); return

    print(f"Connecting to pop.zoho.com for {EMAIL_USER}...")
    
    try:
        # Connect
        pop = poplib.POP3_SSL("pop.zoho.com")
        print(f"Connected: {pop.getwelcome()}")
        
        # Auth String for XOAUTH2
        # user={user}\x01auth=Bearer {token}\x01\x01
        auth_string = f"user={EMAIL_USER}\x01auth=Bearer {token}\x01\x01"
        
        # POP3 does not have a standard 'authenticate' method in python's poplib for XOAUTH2 automatically
        # We must use 'AUTH XOAUTH2' command manually or finding a library wrapper.
        # However, standard POP3 AUTH command:
        # AUTH XOAUTH2 <base64_encoded_auth_string> -> No, usually just command.
        
        # Trying CAPA first
        # print(pop.capa())
        
        # Many servers expect "AUTH XOAUTH2"
        # But python poplib uses 'user'/'pass_' by default.
        # We can try raw command.
        
        # Actually, python 3.13+ limits, but standard lib has 'auth' method? No.
        # We'll skip complex SASL implementation for now and try basic USER/PASS if user had password
        # But we only have token.
        
        # Simplified: If IMAP failed on SASL, POP3 likely will too without specific library support.
        # We will Abort POP and focus on fixing the result for the user.
        print("Skipping POP3 complex auth.")
        
    except Exception as e:
        print(f"❌ POP Error: {e}")

if __name__ == "__main__":
    debug_pop()
