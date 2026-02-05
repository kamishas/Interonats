import requests
import json

# Test with actual campaign ID format
API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING WITH REAL CAMPAIGN ID")
print("="*80)

campaign_id = "1767581833632"  # From browser agent test

# Test recipients endpoint
print(f"\n1. POST /campaigns/{campaign_id}/recipients")
print("-"*80)

url = f"{API_BASE}/campaigns/{campaign_id}/recipients"
data = {
    "recipients": [
        {
            "email": "shasankkamineni@gmail.com",
            "firstName": "Shasank",
            "lastName": "Kamineni",
            "company": "Test",
            "status": "pending"
        }
    ]
}

try:
    response = requests.post(url, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 200:
        print("✅ SUCCESS!")
    else:
        print(f"❌ Failed")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print(f"\n{'='*80}")
