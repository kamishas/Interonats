import urllib.request
import urllib.parse
import urllib.error
import json
import base64

# SANDBOX Token URL (CAT - Customer Acceptance Testing)
URL = "https://api-cat.usps.com/oauth2/v3/token"

CLIENT_KEY = 'dCeWPspWze4SR3iXtOf7KlW9FkgLGFYBT8k16NHDaEnMKqUC'
CLIENT_SECRET = '0PURhG9uYo9YM7bBhZTkcvzSRvqkmwlGeAmz1KOK0knG4yARSYGmWmUIASXxpTHx'

def test_sandbox_auth():
    print(f"Testing USPS Sandbox (CAT) Auth: {URL}")
    
    # Try 1: Basic Auth (Standard)
    auth_str = f"{CLIENT_KEY}:{CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    
    data = urllib.parse.urlencode({
        'grant_type': 'client_credentials'
    }).encode('utf-8')
    
    req = urllib.request.Request(URL, data=data, method='POST')
    req.add_header('Authorization', f"Basic {b64_auth}")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    req.add_header('User-Agent', 'OneHREmailAgent/1.0')
    req.add_header('Accept', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            print("SUCCESS! These are SANDBOX keys.")
            print(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Sandbox Failed: {e.code}")
        print(e.read().decode())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_sandbox_auth()
