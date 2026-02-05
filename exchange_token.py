import urllib3
import urllib.parse
import json
import sys

# Usage: python exchange_token.py <AUTH_CODE>

CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
REDIRECT_URI = "http://localhost"
AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"

http = urllib3.PoolManager()

def exchange(code):
    print(f"🚀 Exchanging Code: {code[:10]}...")
    
    params = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    encoded_params = urllib.parse.urlencode(params)
    url = f"{AUTH_URL}?{encoded_params}"
    
    resp = http.request("POST", url)
    
    if resp.status != 200:
        print(f"❌ Error: {resp.data.decode('utf-8')}")
        return
    
    data = json.loads(resp.data.decode('utf-8'))
    print("\n✅ SUCCESS! Here are your tokens:\n")
    print(json.dumps(data, indent=2))
    
    with open('token.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("✅ Credentials saved to token.json")
    
    refresh_token = data.get("refresh_token")

    if refresh_token:
        print(f"\n🔑 NEW REFRESH TOKEN: {refresh_token}")
        print("(Save this!)")
    else:
        print("\n⚠️ No Refresh Token returned. (Did you use access_type=offline?)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python exchange_token.py <AUTH_CODE>")
    else:
        exchange(sys.argv[1])
