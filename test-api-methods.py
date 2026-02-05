import requests
import json

URL = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/campaigns/1767889513530/recipients"

def test():
    print(f"Testing URL: {URL}")
    
    # 1. Test GET
    print("\n[GET] Requesting...")
    try:
        r = requests.get(URL)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text[:200]}")
    except Exception as e:
        print(f"GET Failed: {e}")

    # 2. Test POST
    print("\n[POST] Requesting...")
    try:
        r = requests.post(URL, json={"recipients": []})
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text[:200]}")
    except Exception as e:
        print(f"POST Failed: {e}")

if __name__ == "__main__":
    test()
