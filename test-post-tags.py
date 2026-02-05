import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING POST /contacts/tags")
print("="*80)

# Test creating a tag
url = f"{API_BASE}/contacts/tags"
data = {"name": "Test Tag"}

print(f"\nPOST {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data, timeout=10)
    
    print(f"\nStatus: {response.status_code}")
    print(f"CORS: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    
    if response.status_code == 200:
        print(f"✅ SUCCESS")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ FAILED")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
