import requests

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING API ENDPOINTS WITH CORS")
print("="*80)

endpoints = [
    {"method": "GET", "path": "/contacts"},
    {"method": "GET", "path": "/campaigns"},
    {"method": "OPTIONS", "path": "/contacts"},
]

for endpoint in endpoints:
    print(f"\n{endpoint['method']} {endpoint['path']}")
    print("-"*80)
    
    try:
        if endpoint['method'] == 'GET':
            response = requests.get(f"{API_BASE}{endpoint['path']}", timeout=5)
        elif endpoint['method'] == 'OPTIONS':
            response = requests.options(f"{API_BASE}{endpoint['path']}", timeout=5)
        
        print(f"Status: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin', 'NOT SET'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods', 'NOT SET'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers', 'NOT SET'),
        }
        
        print(f"CORS Headers:")
        for key, value in cors_headers.items():
            status = "✅" if value != 'NOT SET' else "❌"
            print(f"  {status} {key}: {value}")
        
        if response.status_code == 200:
            print(f"✅ SUCCESS")
            if endpoint['method'] == 'GET':
                try:
                    data = response.json()
                    print(f"Response: {list(data.keys())}")
                except:
                    pass
        else:
            print(f"❌ FAILED: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

print("\n" + "="*80)
print("TEST COMPLETE")
print("="*80)
