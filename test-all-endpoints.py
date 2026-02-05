import requests
import json

print("="*80)
print("TESTING ALL API ENDPOINTS")
print("="*80)

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

endpoints = [
    {"method": "GET", "path": "/contacts", "name": "List Contacts"},
    {"method": "GET", "path": "/campaigns", "name": "List Campaigns"},
    {"method": "POST", "path": "/campaigns", "name": "Create Campaign", "data": {"name": "Test Campaign"}},
]

for endpoint in endpoints:
    print(f"\n{'='*80}")
    print(f"Testing: {endpoint['name']}")
    print(f"{endpoint['method']} {API_BASE}{endpoint['path']}")
    print("="*80)
    
    try:
        if endpoint['method'] == 'GET':
            response = requests.get(f"{API_BASE}{endpoint['path']}", timeout=10)
        elif endpoint['method'] == 'POST':
            response = requests.post(
                f"{API_BASE}{endpoint['path']}", 
                json=endpoint.get('data', {}),
                timeout=10
            )
        
        print(f"Status Code: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin', 'NOT SET'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods', 'NOT SET'),
        }
        print(f"CORS Headers: {cors_headers}")
        
        if response.status_code == 200:
            print(f"✅ SUCCESS")
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)[:300]}")
            except:
                print(f"Response: {response.text[:300]}")
        else:
            print(f"❌ FAILED")
            print(f"Response: {response.text[:500]}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
print("CHECKING FRONTEND CONFIGURATION")
print("="*80)

# Check frontend api.js
try:
    with open(r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\config\api.js', 'r') as f:
        content = f.read()
        
    # Extract API_BASE_URL
    import re
    api_base_match = re.search(r"const API_BASE_URL = '([^']+)'", content)
    send_api_match = re.search(r"const SEND_API_URL = '([^']+)'", content)
    
    if api_base_match:
        print(f"Frontend API_BASE_URL: {api_base_match.group(1)}")
    if send_api_match:
        print(f"Frontend SEND_API_URL: {send_api_match.group(1)}")
        
    print(f"\n✅ Expected: https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com")
    
except Exception as e:
    print(f"❌ Error reading frontend config: {str(e)}")

print(f"\n{'='*80}")
