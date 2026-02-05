import requests
import json

BASE_URL = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod"

print("1. Listing Campaigns...")
try:
    resp = requests.get(f"{BASE_URL}/campaigns")
    print(f"Status: {resp.status_code}")
    data = resp.json()
    campaigns = data.get('campaigns', [])
    
    if not campaigns:
        print("No campaigns found. Cannot test detail view.")
        exit()
        
    first_id = campaigns[0]['id']
    print(f"Found Campaign ID: {first_id}")
    
    print("\n2. Fetching Campaign Details...")
    detail_resp = requests.get(f"{BASE_URL}/campaigns/{first_id}")
    print(f"Status: {detail_resp.status_code}")
    
    if detail_resp.status_code == 200:
        detail = detail_resp.json()
        print("Keys returned:", list(detail.keys()))
        
        if 'recipients' in detail:
            print(f"✅ Success! Found {len(detail['recipients'])} recipients in response.")
        else:
            print("❌ Failed: 'recipients' key missing from response.")
            print(json.dumps(detail, indent=2))
    else:
        print(f"❌ Failed to fetch details. Status: {detail_resp.status_code}")
        print(detail_resp.text)

except Exception as e:
    print(f"❌ Error during test: {e}")
