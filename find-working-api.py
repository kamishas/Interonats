import requests

# Test which API has the /send endpoint
apis = [
    ('5cs5faz106', 'https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod'),
    ('5tdsq6s7h3', 'https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com')
]

print("="*80)
print("FINDING THE CORRECT API GATEWAY")
print("="*80)

working_api = None

for api_id, base_url in apis:
    print(f"\nTesting {api_id}...")
    print(f"URL: {base_url}")
    
    # Test /campaigns endpoint (should exist)
    try:
        response = requests.get(f"{base_url}/campaigns", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ /campaigns: 200 OK")
            working_api = (api_id, base_url)
            break
        else:
            print(f"  ❌ /campaigns: {response.status_code}")
    except Exception as e:
        print(f"  ❌ /campaigns: {str(e)}")

print(f"\n{'='*80}")
if working_api:
    print(f"✅ WORKING API FOUND: {working_api[0]}")
    print(f"   URL: {working_api[1]}")
    print(f"\nUpdate frontend to use: {working_api[1]}")
else:
    print("❌ No working API found")
print("="*80)
