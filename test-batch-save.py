import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING POST /contacts/batch")
print("="*80)

# Test batch save
url = f"{API_BASE}/contacts/batch"
data = {
    "contacts": [
        {
            "email": "test1@example.com",
            "firstName": "Test",
            "lastName": "User1",
            "company": "Test Corp",
            "tags": ["TestTag"]
        },
        {
            "email": "test2@example.com",
            "firstName": "Test",
            "lastName": "User2",
            "company": "Test Corp",
            "tags": []
        }
    ]
}

print(f"\nPOST {url}")
print(f"Contacts: {len(data['contacts'])}")

try:
    response = requests.post(url, json=data, timeout=15)
    
    print(f"\nStatus: {response.status_code}")
    print(f"CORS: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    
    if response.status_code == 200:
        print(f"✅ SUCCESS!")
        result = response.json()
        print(f"\nSaved: {result.get('savedCount', 0)}")
        print(f"Failed: {result.get('failedCount', 0)}")
    else:
        print(f"❌ FAILED - Status {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
