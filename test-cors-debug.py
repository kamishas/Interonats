import requests
import json

URL = "https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/campaigns/scan"

def test():
    print("Testing OPTIONS...")
    try:
        r = requests.options(URL)
        print(f"Status: {r.status_code}")
        print("Headers:", json.dumps(dict(r.headers), indent=2))
    except Exception as e:
        print(f"OPTIONS Failed: {e}")

    print("\nTesting POST...")
    try:
        r = requests.post(URL, json={})
        print(f"Status: {r.status_code}")
        print("Headers:", json.dumps(dict(r.headers), indent=2))
        print("Body:", r.text[:200])
    except Exception as e:
        print(f"POST Failed: {e}")

if __name__ == "__main__":
    test()
