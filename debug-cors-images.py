import requests
import base64
import os

API_URL = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/images"
Origin = "http://localhost:3000"
IMAGE_PATH = r"C:\Users\kamin\Downloads\Interon\Emails Agent\Test data\1668198287318.jpg"

def test_options():
    print(f"Testing OPTIONS {API_URL}...")
    try:
        response = requests.options(API_URL, headers={"Origin": Origin, "Access-Control-Request-Method": "POST"})
        print(f"Status Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
    except Exception as e:
        print(f"OPTIONS request failed: {e}")

def test_post_upload():
    print(f"\nTesting POST {API_URL}...")
    
    if not os.path.exists(IMAGE_PATH):
        print(f"Image not found: {IMAGE_PATH}")
        return

    with open(IMAGE_PATH, "rb") as f:
        image_bytes = f.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    payload = {
        "image": image_base64,
        "filename": "test_image.jpg",
        "campaignId": "debug_test"
    }
    
    try:
        # Long timeout for Bedrock
        response = requests.post(API_URL, json=payload, headers={"Origin": Origin, "Content-Type": "application/json"}, timeout=30)
        print(f"Status Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
        print("\nResponse Body:")
        print(response.text[:500] + "..." if len(response.text) > 500 else response.text)
    except Exception as e:
        print(f"POST request failed: {e}")

if __name__ == "__main__":
    test_options()
    test_post_upload()
