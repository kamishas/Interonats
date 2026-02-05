import requests

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"
campaign_id = "1767582473521"  # From user's console log

print("="*80)
print("TESTING GET RECIPIENTS ENDPOINT")
print("="*80)

url = f"{API_BASE}/campaigns/{campaign_id}/recipients"
print(f"\nGET {url}")

try:
    response = requests.get(url, timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {data}")
        print(f"\n✅ SUCCESS! Found {data.get('count', 0)} recipients")
    else:
        print(f"Response: {response.text}")
        print(f"❌ Failed with status {response.status_code}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print(f"\n{'='*80}")
