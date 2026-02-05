import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("BROWSER-LIKE API TEST")
print("="*80)

# Simulate browser request with all headers
headers = {
    'Origin': 'https://interon-email-agent-frontend-kamin.s3.us-east-2.amazonaws.com',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0'
}

endpoints = [
    '/contacts',
    '/contacts/tags',
    '/campaigns'
]

for endpoint in endpoints:
    print(f"\n{'='*80}")
    print(f"Testing: GET {endpoint}")
    print("="*80)
    
    try:
        # Test OPTIONS first (preflight)
        print("\n1. OPTIONS (preflight):")
        options_response = requests.options(
            f"{API_BASE}{endpoint}",
            headers=headers,
            timeout=5
        )
        print(f"   Status: {options_response.status_code}")
        print(f"   CORS Origin: {options_response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        print(f"   CORS Methods: {options_response.headers.get('Access-Control-Allow-Methods', 'NOT SET')}")
        
        # Test GET
        print("\n2. GET request:")
        get_response = requests.get(
            f"{API_BASE}{endpoint}",
            headers=headers,
            timeout=5
        )
        print(f"   Status: {get_response.status_code}")
        print(f"   CORS Origin: {get_response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        
        if get_response.status_code == 200:
            print(f"   ✅ SUCCESS")
            try:
                data = get_response.json()
                print(f"   Response keys: {list(data.keys())}")
            except:
                print(f"   Response: {get_response.text[:100]}")
        else:
            print(f"   ❌ FAILED")
            print(f"   Error: {get_response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
print("TEST COMPLETE")
print("="*80)
