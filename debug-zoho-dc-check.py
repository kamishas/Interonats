import requests
import json

# Config
REFRESH_TOKEN_FILE = "refresh_token.txt"
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"

# List of Data Centers to probe
DCS = {
    "US": "https://mail.zoho.com",
    "IN": "https://mail.zoho.in",
    "EU": "https://mail.zoho.eu",
    "AU": "https://mail.zoho.com.au"
}

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

def probe_dcs():
    token = get_token()
    if not token: return
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}

    for name, base_url in DCS.items():
        print(f"\n--- Probing {name} ({base_url}) ---")
        try:
            url = f"{base_url}/api/accounts"
            resp = requests.get(url, headers=headers, timeout=5)
            
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json().get("data")
                if data:
                    acc = data[0]
                    storage = acc.get("usedStorage", 0)
                    zuid = acc.get("zuid")
                    print(f"  ✅ SUCCESS!")
                    print(f"  ZUID: {zuid}")
                    print(f"  Storage: {storage} bytes ({storage/1024/1024:.2f} MB)")
                else:
                    print("  ❌ No Account Data")
            else:
                print(f"  ❌ Error: {resp.text[:100]}")
                
        except Exception as e:
            print(f"  ❌ Exception: {e}")

if __name__ == "__main__":
    probe_dcs()
