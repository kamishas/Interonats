import requests
import json

# Test the send campaign endpoint
api_url = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod"
campaign_id = "test-campaign-123"

print(f"Testing: POST {api_url}/campaigns/{campaign_id}/send\n")

try:
    response = requests.post(
        f"{api_url}/campaigns/{campaign_id}/send",
        headers={"Content-Type": "application/json"},
        json={"retry": False},
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    
    print(f"\nResponse Body:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
        
except requests.exceptions.Timeout:
    print("❌ Request timed out (Lambda may be taking too long)")
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
