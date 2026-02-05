import requests
import sys

# New Credentials provided by user
CLIENT_ID = "1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC"
CLIENT_SECRET = "7523dc499deb78d76b88cd20771a509cbab00ce24b"
REDIRECT_URI = "http://localhost"

def exchange(auth_code):
    print(f"Exchanging code for token...")
    url = "https://accounts.zoho.com/oauth/v2/token"
    params = {
        "code": auth_code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    resp = requests.post(url, data=params)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    
    if "refresh_token" in data:
        token = data['refresh_token']
        print(f"\nSUCCESS! Refresh Token:\n{token}")
        print(f"\nAccess Token:\n{data.get('access_token')}")
        
        with open("refresh_token.txt", "w") as f:
            f.write(token)
        print("Token written to refresh_token.txt")
    else:
        print(f"\nERROR: Could not get refresh token.\nResponse: {data}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python exchange_code.py <auth_code>")
    else:
        exchange(sys.argv[1])
