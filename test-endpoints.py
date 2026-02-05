import requests
import json

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING RECIPIENTS AND CONFIG ENDPOINTS")
print("="*80)

# Test 1: POST /campaigns/{id}/recipients
print("\n1. Testing POST /campaigns/test123/recipients")
print("-"*80)
url = f"{API_BASE}/campaigns/test123/recipients"
data = {
    "recipients": [
        {
            "email": "test@example.com",
            "firstName": "Test",
            "lastName": "User",
            "company": "Test Corp",
            "status": "pending"
        }
    ]
}

try:
    response = requests.post(url, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Recipients endpoint WORKING!")
    else:
        print(f"❌ Failed with status {response.status_code}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

# Test 2: POST /campaigns/{id}/config
print("\n2. Testing POST /campaigns/test123/config")
print("-"*80)
url = f"{API_BASE}/campaigns/test123/config"
data = {
    "subject": "Test Subject",
    "bodyTemplate": "Test body content",
    "images": []
}

try:
    response = requests.post(url, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Config endpoint WORKING!")
    else:
        print(f"❌ Failed with status {response.status_code}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print(f"\n{'='*80}")
