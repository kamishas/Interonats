import boto3
import requests
import json
import time

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"
campaign_id = f"email_test_{int(time.time())}"

print(f"Testing with Campaign ID: {campaign_id}")

# 1. Create Campaign (so it exists in Campaigns table)
print("\n1. Creating Campaign...")
config_url = f"{API_BASE}/campaigns/{campaign_id}/config"
config_data = {
    "subject": "Test Email via API",
    "bodyTemplate": "Hello {{firstName}}, this is a test email.",
    "images": []
}
resp = requests.post(config_url, json=config_data, timeout=10)
print(f"Config Status: {resp.status_code}")

# 2. Add Recipient (so we have someone to send to)
print("\n2. Adding Recipient...")
recip_url = f"{API_BASE}/campaigns/{campaign_id}/recipients"
recip_data = {
    "recipients": [
        {
            "email": "shasankkamineni@gmail.com",
            "firstName": "Shasank",
            "lastName": "Test",
            "status": "pending"
        }
    ]
}
resp = requests.post(recip_url, json=recip_data, timeout=10)
print(f"Recipient Status: {resp.status_code}")

# 3. Send Campaign
print("\n3. Sending Campaign...")
send_url = f"{API_BASE}/campaigns/{campaign_id}/send"
try:
    resp = requests.post(send_url, json={"retry": False}, timeout=30)
    print(f"Send Status: {resp.status_code}")
    print(f"Send Body: {resp.text}")
    
    if resp.status_code == 200:
        print("\n✅ SUCCESS! Email send triggered.")
    elif resp.status_code == 404:
        print("\n❌ FAILED: Campaign still not found (Propagation delay?)")
    else:
        print(f"\n❌ FAILED: {resp.text}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
