import requests
import json
import time

# Campaign SS123
CAMPAIGN_ID = "1767636953859"
API_URL = f"https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com/campaigns/{CAMPAIGN_ID}/send"

def test_send():
    print(f"🚀 Triggering Final Send for Campaign {CAMPAIGN_ID} (ss123)...")
    
    try:
        # Force Retry to ensure it sends even if marked sent
        payload = {"retry": True}
        
        start = time.time()
        response = requests.post(API_URL, json=payload)
        end = time.time()
        
        print(f"⏱️ Time taken: {end - start:.2f}s")
        print(f"Status Code: {response.status_code}")
        
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200:
                print("✅ Email Pipeline Success! Check your Inbox.")
            else:
                print("❌ Pipeline Failed.")
                
        except json.JSONDecodeError:
            print(f"Raw Body: {response.text}")

    except Exception as e:
        print(f"❌ Execution Error: {e}")

if __name__ == "__main__":
    test_send()
