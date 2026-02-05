import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("COMPLETE END-TO-END TEST")
print("="*80)

# Test campaign ID
campaign_id = "test_final_" + str(int(1767582914))

# Step 1: Add recipient
print(f"\n1. Adding recipient to campaign {campaign_id}")
print("-"*80)
url = f"{API_BASE}/campaigns/{campaign_id}/recipients"
data = {
    "recipients": [
        {
            "email": "shasankkamineni@gmail.com",
            "firstName": "Shasank",
            "lastName": "Kamineni",
            "company": "Test Company",
            "status": "pending"
        }
    ]
}

response = requests.post(url, json=data, timeout=10)
print(f"POST Status: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    print("✅ Recipient saved successfully!")
else:
    print("❌ Failed to save recipient")
    exit(1)

# Step 2: Fetch recipients
print(f"\n2. Fetching recipients for campaign {campaign_id}")
print("-"*80)
url = f"{API_BASE}/campaigns/{campaign_id}/recipients"

response = requests.get(url, timeout=10)
print(f"GET Status: {response.status_code}")
data = response.json()
print(f"Response: {data}")

if response.status_code == 200:
    count = data.get('count', 0)
    print(f"✅ Successfully fetched {count} recipient(s)!")
    
    if count > 0:
        print("\n🎉 COMPLETE SUCCESS!")
        print("Recipients are being saved and loaded correctly!")
        print("\nYou can now:")
        print("1. Refresh your browser (Ctrl+F5)")
        print("2. Create a campaign and add recipients")
        print("3. Navigate to Launchpad")
        print("4. Recipients will appear!")
    else:
        print("⚠️  No recipients found (might need to wait a moment)")
else:
    print("❌ Failed to fetch recipients")

print(f"\n{'='*80}")
