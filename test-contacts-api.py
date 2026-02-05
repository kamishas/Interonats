import requests

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING CONTACTS API")
print("="*80)

url = f"{API_BASE}/contacts"
print(f"\nGET {url}")

try:
    response = requests.get(url, timeout=10)
    
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        contacts = data.get('contacts', [])
        print(f"✅ SUCCESS - {len(contacts)} contacts returned")
        
        if contacts:
            print(f"\nFirst contact:")
            first = contacts[0]
            print(f"  Keys: {list(first.keys())}")
            print(f"  Email: {first.get('email')}")
            print(f"  Name: {first.get('firstName')} {first.get('lastName')}")
            print(f"  Company: {first.get('company')}")
        else:
            print("\n⚠️  No contacts in database")
    else:
        print(f"❌ FAILED - Status {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
