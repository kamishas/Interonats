import requests

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("QUICK ENDPOINT TEST")
print("="*80)

# Test contacts
print("\n1. Testing /contacts...")
try:
    r = requests.get(f"{API_BASE}/contacts", timeout=5)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   ✅ SUCCESS")
        print(f"   Response: {r.json()}")
    else:
        print(f"   ❌ FAILED: {r.text[:200]}")
except Exception as e:
    print(f"   ❌ ERROR: {str(e)}")

# Test campaigns  
print("\n2. Testing /campaigns...")
try:
    r = requests.get(f"{API_BASE}/campaigns", timeout=5)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   ✅ SUCCESS")
        print(f"   Response: {r.json()}")
    else:
        print(f"   ❌ FAILED: {r.text[:200]}")
except Exception as e:
    print(f"   ❌ ERROR: {str(e)}")

print("\n" + "="*80)
