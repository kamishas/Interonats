
import urllib.request
import json
import time

URL = "https://7snygleovteenscdunpgohnp4y0wphxz.lambda-url.us-east-1.on.aws/"

def test(method='GET', data=None):
    print(f"Testing {method}...")
    try:
        req = urllib.request.Request(URL, method=method)
        if data:
            req.data = data
            req.add_header('Content-Type', 'application/json')
        
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.getcode()}")
            print(f"Body: {response.read().decode('utf-8')[:100]}...")
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.reason}")
        print(f"Error Body: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Exception: {e}")

print("--- POST Test ---")
test('POST', json.dumps({'action': 'autocomplete', 'query': '1600'}).encode('utf-8'))

print("\n--- GET Test ---")
test('GET')
