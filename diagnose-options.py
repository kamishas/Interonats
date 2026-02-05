import boto3
import json

API_ID = '5cs5faz106'
REGION = 'us-east-2'

client = boto3.client('apigateway', region_name=REGION)

def diagnose():
    resources = client.get_resources(restApiId=API_ID, limit=500)['items']
    target_res = None
    for r in resources:
        if 'recipients' in r.get('path', ''):
            target_res = r
            break
            
    if not target_res:
        print("Resource not found")
        return

    res_id = target_res['id']
    print(f"Resource: {target_res['path']} ({res_id})")

    try:
        method = client.get_method(restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS')
        print("\n--- Method Request ---")
        print(f"Auth Type: {method.get('authorizationType')}")
        print(f"API Key Required: {method.get('apiKeyRequired')}")
        
        integ = client.get_integration(restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS')
        print("\n--- Integration Request ---")
        print(f"Type: {integ.get('type')}")
        print(f"URI: {integ.get('uri')}")
        print("Request Templates:", integ.get('requestTemplates'))
        
        integ_resp = client.get_integration_response(restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', statusCode='200')
        print("\n--- Integration Response (200) ---")
        print("Response Parameters:", json.dumps(integ_resp.get('responseParameters'), indent=2))
        
        method_resp = client.get_method_response(restApiId=API_ID, resourceId=res_id, httpMethod='OPTIONS', statusCode='200')
        print("\n--- Method Response (200) ---")
        print("Response Parameters:", json.dumps(method_resp.get('responseParameters'), indent=2))
        
    except Exception as e:
        print(f"Error getting OPTIONS details: {e}")

if __name__ == "__main__":
    diagnose()
