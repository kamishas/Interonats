import requests
import json
import base64

API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

print("="*80)
print("TESTING IMAGE COMPLIANCE ENDPOINT")
print("="*80)

# Create a simple test image (1x1 pixel black image)
black_pixel = base64.b64encode(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82').decode()

url = f"{API_BASE}/images"
data = {
    "image": f"data:image/png;base64,{black_pixel}",
    "campaignId": "test",
    "filename": "test-black.png"
}

print(f"\nPOST {url}")
print(f"Testing with black image (should be compliant)")

try:
    response = requests.post(url, json=data, timeout=30)
    
    print(f"\nStatus: {response.status_code}")
    print(f"CORS: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Response received:")
        print(f"   Is Compliant: {result.get('isCompliant')}")
        print(f"   Violations: {len(result.get('violations', []))}")
        print(f"   Message: {result.get('message')}")
        if result.get('extractedText'):
            print(f"   Extracted Text: {result.get('extractedText')[:100]}")
    else:
        print(f"❌ FAILED - Status {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print(f"\n{'='*80}")
