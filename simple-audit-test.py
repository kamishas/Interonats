import requests
import time
import json

campaign_id = f"audit_test_{int(time.time())}"
base_url = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print(f"Testing Campaign ID: {campaign_id}")

payload = {
    "recipients": [
        {
            "email": "audit@test.com",
            "firstName": "Audit",
            "lastName": "User",
            "company": "AuditCorp",
            "status": "pending"
        }
    ]
}

print("\n1. Sending POST (Save)...")
try:
    post_resp = requests.post(f"{base_url}/campaigns/{campaign_id}/recipients", json=payload, timeout=10)
    print(f"POST Status: {post_resp.status_code}")
    print(f"POST Body: {post_resp.text}")
except Exception as e:
    print(f"POST FAILED: {str(e)}")
    exit(1)

print("\n2. Sending GET (Fetch)...")
try:
    get_resp = requests.get(f"{base_url}/campaigns/{campaign_id}/recipients", timeout=10)
    print(f"GET Status: {get_resp.status_code}")
    print(f"GET Body: {get_resp.text}")
    
    data = get_resp.json()
    count = data.get('count', 0)
    
    if count == 1:
        print("\n✅ SUCCESS: Data Saved and Retrieved.")
    else:
        print(f"\n❌ FAILURE: Count is {count}, expected 1.")

except Exception as e:
    print(f"GET FAILED: {str(e)}")
