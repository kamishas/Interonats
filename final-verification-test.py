import requests

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("FINAL VERIFICATION - ALL ENDPOINTS")
print("="*80)

endpoints = [
    '/contacts',
    '/contacts/tags',
    '/campaigns'
]

all_passed = True

for endpoint in endpoints:
    print(f"\nTesting: {endpoint}")
    try:
        response = requests.get(f"{API_BASE}{endpoint}", timeout=5)
        cors = response.headers.get('Access-Control-Allow-Origin', 'NOT SET')
        
        if response.status_code == 200 and cors != 'NOT SET':
            print(f"  ✅ Status: {response.status_code}, CORS: {cors}")
        else:
            print(f"  ❌ Status: {response.status_code}, CORS: {cors}")
            all_passed = False
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        all_passed = False

print("\n" + "="*80)
if all_passed:
    print("✅ ALL ENDPOINTS WORKING!")
else:
    print("❌ SOME ENDPOINTS FAILED")
print("="*80)
