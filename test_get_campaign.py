import requests
import json

# Base URL from endpoints.md
BASE_URL = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod"

# Campaign ID from user's screenshot ("4:03 PM TEST")
CAMPAIGN_ID = "1768251823229"

def test_get_campaign():
    url = f"{BASE_URL}/campaigns/{CAMPAIGN_ID}"
    print(f"Testing GET {url} ...")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            # print(json.dumps(data, indent=2))
            
            recipients = data.get('recipients', [])
            print(f"✅ Found {len(recipients)} recipients in campaign object.")
            if recipients:
                print("Sample Recipient:", recipients[0])
        else:
            print("❌ Failed:", response.text)
            
            # Try /recipients endpoint fallback
            test_get_recipients_subresource()

    except Exception as e:
        print(f"Error: {e}")

def test_get_recipients_subresource():
    url = f"{BASE_URL}/campaigns/{CAMPAIGN_ID}/recipients"
    print(f"\nTesting subresource GET {url} ...")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            recipients = data.get('recipients', [])
            print(f"✅ Found {len(recipients)} recipients in subresource.")
            if recipients:
                print("Sample Recipient:", recipients[0])
        else:
             print("❌ Failed:", response.text)

    except Exception as e:
         print(f"Error: {e}")

if __name__ == "__main__":
    test_get_campaign()
