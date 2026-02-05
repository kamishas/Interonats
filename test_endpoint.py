import urllib.request
import json
import urllib.error

url = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/util/verify-address"
payload = {"action": "autocomplete", "query": "4313 Ramona Dr, Fairfax, VA, 22030"}
data = json.dumps(payload).encode('utf-8')
headers = {"Content-Type": "application/json"}

print(f"Testing URL: {url}")
print(f"Payload: {payload}")

req = urllib.request.Request(url, data=data, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.getcode()}")
        print("Response Body:")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print("Error Body:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
