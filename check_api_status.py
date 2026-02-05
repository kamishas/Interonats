import requests

url = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/contacts"
try:
    print(f"Checking {url}...")
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
