
import urllib.request
import json
import time

# Based on output ID
URL = "https://7a8in913p9.execute-api.us-east-1.amazonaws.com/"

def test():
    print("Testing POST...")
    try:
        req = urllib.request.Request(URL, method='POST')
        req.data = json.dumps({'action': 'autocomplete', 'query': '1600'}).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.getcode()}")
            body = response.read().decode('utf-8')
            print(f"Body: {body[:200]}")
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.reason}")
        print(f"Error Body: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Exception: {e}")

test()
