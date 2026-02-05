import boto3
import json
import urllib3
import urllib.parse

def verify():
    client = boto3.client('lambda', region_name='us-east-2')
    print("Fetching Env...")
    conf = client.get_function_configuration(FunctionName='SendCampaignLambda')
    env = conf['Environment']['Variables']

    CID = env.get('ZOHO_CLIENT_ID')
    SEC = env.get('ZOHO_CLIENT_SECRET')
    TOK = env.get('ZOHO_REFRESH_TOKEN')
    ACC = env.get('ZOHO_ACCOUNT_ID')

    if not (CID and SEC and TOK and ACC):
        print("❌ Env vars missing")
        return

    http = urllib3.PoolManager()

    print("Refreshing Token...")
    params = {
        "refresh_token": TOK,
        "client_id": CID,
        "client_secret": SEC,
        "grant_type": "refresh_token"
    }
    encoded = urllib.parse.urlencode(params)
    
    resp = http.request("POST", f"https://accounts.zoho.com/oauth/v2/token?{encoded}")
    data = json.loads(resp.data.decode('utf-8'))
    access = data.get("access_token")

    if not access:
        print(f"❌ Failed to refresh: {data}")
        return

    print("✅ Token Refreshed.")
    print("Testing READ (/messages)...")
    
    # Try Listing Messages
    url = f"https://mail.zoho.com/api/accounts/{ACC}/messages?limit=1"
    r2 = http.request("GET", url, headers={"Authorization": f"Zoho-oauthtoken {access}"})
    
    print(f"Status: {r2.status}")
    if r2.status == 200:
        print("✅ SUCCESS! We have READ permission.")
    else:
        print(f"❌ FAIL: {r2.data.decode('utf-8')}")

if __name__ == "__main__":
    verify()
