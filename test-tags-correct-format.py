import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING POST /contacts/tags WITH CORRECT FORMAT")
print("="*80)

# Test with the exact format the frontend sends
url = f"{API_BASE}/contacts/tags"
data = {
    "tagName": "Test Label",
    "color": "#3b82f6"
}

print(f"\nPOST {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data, timeout=10)
    
    print(f"\nStatus: {response.status_code}")
    print(f"CORS: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    
    if response.status_code == 200:
        print(f"✅ SUCCESS!")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"❌ FAILED - Status {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
