import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("STEP 3: TESTING API GATEWAY ENDPOINTS VIA HTTP")
print("="*80)

endpoints_to_test = [
    {'method': 'GET', 'path': '/contacts', 'expected': 200},
    {'method': 'GET', 'path': '/contacts/tags', 'expected': 200},
    {'method': 'GET', 'path': '/campaigns', 'expected': 200},
]

results = {}

for endpoint in endpoints_to_test:
    url = f"{API_BASE}{endpoint['path']}"
    print(f"\n{'='*80}")
    print(f"{endpoint['method']} {endpoint['path']}")
    print(f"URL: {url}")
    print("="*80)
    
    try:
        if endpoint['method'] == 'GET':
            response = requests.get(url, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"CORS Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        
        if response.status_code == endpoint['expected']:
            print(f"✅ SUCCESS")
            results[endpoint['path']] = 'PASS'
            try:
                data = response.json()
                print(f"Response keys: {list(data.keys())}")
            except:
                pass
        else:
            print(f"❌ FAILED - Expected {endpoint['expected']}, got {response.status_code}")
            print(f"Response: {response.text[:200]}")
            results[endpoint['path']] = f'FAIL_{response.status_code}'
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results[endpoint['path']] = 'ERROR'

print(f"\n{'='*80}")
print("API GATEWAY ENDPOINT TEST SUMMARY")
print("="*80)

passed = sum(1 for v in results.values() if v == 'PASS')
failed = len(results) - passed

print(f"\n✅ Passed: {passed}/{len(results)}")
print(f"❌ Failed: {failed}/{len(results)}")

print("\nDetailed Results:")
for path, result in results.items():
    symbol = "✅" if result == "PASS" else "❌"
    print(f"  {symbol} {path}: {result}")

print(f"\n{'='*80}")
