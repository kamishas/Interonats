import boto3
import json

API_ID = '5cs5faz106'
REGION = 'us-east-2'

client = boto3.client('apigateway', region_name=REGION)

def diagnose():
    print(f"Diagnosing API: {API_ID}")
    resources = client.get_resources(restApiId=API_ID, limit=500)['items']
    target_res = None
    for r in resources:
        if 'recipients' in r.get('path', ''):
            target_res = r
            break
            
    if not target_res:
        print("❌ Resource not found")
        return

    res_id = target_res['id']
    print(f"✅ Found Resource: {target_res['path']} ({res_id})")
    
    methods = target_res.get('resourceMethods', {}).keys()
    print(f"Available Methods: {list(methods)}")

    for method in ['GET', 'POST']:
        if method not in methods:
            print(f"❌ Method {method} MISSING!")
            continue

        try:
            m_details = client.get_method(restApiId=API_ID, resourceId=res_id, httpMethod=method)
            print(f"\n--- {method} Details ---")
            print(f"Auth: {m_details.get('authorizationType')}")
            
            integ = client.get_integration(restApiId=API_ID, resourceId=res_id, httpMethod=method)
            print(f"Integration Type: {integ.get('type')}")
            print(f"URI: {integ.get('uri')}")
        except Exception as e:
            print(f"Error getting {method} details: {e}")

if __name__ == "__main__":
    diagnose()
