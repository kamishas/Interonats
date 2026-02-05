import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("COMPLETE BACKEND VERIFICATION")
print("="*80)

endpoints_to_test = [
    # Contact Management
    {'method': 'GET', 'path': '/contacts', 'name': 'List Contacts'},
    {'method': 'GET', 'path': '/contacts/tags', 'name': 'List Tags'},
    {'method': 'POST', 'path': '/contacts/tags', 'data': {'tagName': 'TestTag', 'color': '#3b82f6'}, 'name': 'Create Tag'},
    {'method': 'POST', 'path': '/contacts/validate', 'data': {'contacts': [{'email': 'test@example.com', 'firstName': 'Test', 'lastName': 'User'}]}, 'name': 'Validate Contacts'},
    
    # Campaign Management
    {'method': 'GET', 'path': '/campaigns', 'name': 'List Campaigns'},
]

results = {'passed': 0, 'failed': 0}

for endpoint in endpoints_to_test:
    url = f"{API_BASE}{endpoint['path']}"
    print(f"\n{'='*80}")
    print(f"{endpoint['name']}: {endpoint['method']} {endpoint['path']}")
    print("="*80)
    
    try:
        if endpoint['method'] == 'GET':
            response = requests.get(url, timeout=10)
        elif endpoint['method'] == 'POST':
            response = requests.post(url, json=endpoint.get('data', {}), timeout=10)
        
        status = response.status_code
        cors = response.headers.get('Access-Control-Allow-Origin', 'NOT SET')
        
        print(f"Status: {status}")
        print(f"CORS: {cors}")
        
        if status == 200 and cors != 'NOT SET':
            print(f"✅ PASS")
            results['passed'] += 1
            try:
                data = response.json()
                print(f"Response keys: {list(data.keys())}")
            except:
                pass
        else:
            print(f"❌ FAIL")
            results['failed'] += 1
            print(f"Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results['failed'] += 1

print(f"\n{'='*80}")
print("VERIFICATION SUMMARY")
print("="*80)
print(f"\n✅ Passed: {results['passed']}/{len(endpoints_to_test)}")
print(f"❌ Failed: {results['failed']}/{len(endpoints_to_test)}")

if results['failed'] == 0:
    print("\n🎉 ALL ENDPOINTS WORKING!")
else:
    print(f"\n⚠️  {results['failed']} endpoint(s) need attention")

print("="*80)
