import requests
import json

print("="*60)
print("TESTING SEND CAMPAIGN API ENDPOINTS")
print("="*60)

# Test 1: Old endpoint (should fail)
print("\n1. Testing OLD endpoint (5cs5faz106):")
print("   URL: https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/campaigns/test-123/send")
try:
    response = requests.post(
        "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/campaigns/test-123/send",
        json={"retry": False},
        timeout=5
    )
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   Error: {str(e)[:100]}")

# Test 2: New endpoint (should work or give Lambda error)
print("\n2. Testing NEW endpoint (5tdsq6s7h3):")
print("   URL: https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com/campaigns/test-123/send")
try:
    response = requests.post(
        "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com/campaigns/test-123/send",
        json={"retry": False},
        timeout=30
    )
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:500]}")
    
    if response.status_code == 200:
        print("   ✅ API Gateway is working!")
    elif response.status_code == 404:
        print("   ❌ Campaign not found (expected for test)")
    elif response.status_code == 500:
        print("   ⚠️  Lambda error - check CloudWatch logs")
except Exception as e:
    print(f"   Error: {str(e)[:100]}")

# Test 3: Check what the frontend is actually using
print("\n3. Checking deployed frontend config:")
try:
    # Fetch the deployed JS file
    response = requests.get("https://interon-email-agent-frontend-kamin.s3.us-east-2.amazonaws.com/index.html")
    html = response.text
    
    # Find the JS file
    import re
    js_match = re.search(r'src="(/assets/index-[^"]+\.js)"', html)
    if js_match:
        js_file = js_match.group(1)
        print(f"   JS file: {js_file}")
        
        # Fetch JS
        js_response = requests.get(f"https://interon-email-agent-frontend-kamin.s3.us-east-2.amazonaws.com{js_file}")
        js_content = js_response.text
        
        if '5tdsq6s7h3' in js_content:
            print("   ✅ NEW API endpoint (5tdsq6s7h3) is in deployed JS!")
        else:
            print("   ❌ NEW API endpoint NOT found in deployed JS")
            
        if '5cs5faz106' in js_content:
            print("   ⚠️  OLD API endpoint (5cs5faz106) still in deployed JS")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60)
