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

all_working = True

for endpoint in endpoints:
    url = f"{API_BASE}{endpoint}"
    try:
        response = requests.get(url, timeout=10)
        cors = response.headers.get('Access-Control-Allow-Origin', 'NOT SET')
        
        if response.status_code == 200 and cors != 'NOT SET':
            print(f"✅ {endpoint}: 200 OK, CORS: {cors}")
        else:
            print(f"❌ {endpoint}: Status {response.status_code}, CORS: {cors}")
            all_working = False
    except Exception as e:
        print(f"❌ {endpoint}: ERROR - {str(e)}")
        all_working = False

print(f"\n{'='*80}")
if all_working:
    print("✅✅✅ ALL ENDPOINTS WORKING! ✅✅✅")
    print("\nYour backend is now fully operational!")
    print("Refresh your browser to see the working system.")
else:
    print("⚠️  Some endpoints still have issues")
print("="*80)
