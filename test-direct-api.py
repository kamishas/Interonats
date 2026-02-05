import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("DIRECT API GATEWAY TEST")
print("="*80)

# Test with exact browser headers
headers = {
    'Origin': 'https://interon-email-agent-frontend-kamin.s3.us-east-2.amazonaws.com',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
}

endpoints = ['/contacts', '/contacts/tags', '/campaigns']

for endpoint in endpoints:
    print(f"\n{'='*80}")
    print(f"Testing: {endpoint}")
    print("="*80)
    
    try:
        response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✅ SUCCESS")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:300]}")
        else:
            print(f"❌ FAILED - Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
