import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
api_id = '5cs5faz106'

print(f"Checking API {api_id}...")

resources = client.get_resources(restApiId=api_id, limit=500)['items']

for res in resources:
    path = res.get('path', 'UNKNOWN')
    res_id = res['id']
    methods = res.get('resourceMethods', {})
    
    for method in methods:
        try:
            integ = client.get_integration(
                restApiId=api_id, 
                resourceId=res_id, 
                httpMethod=method
            )
            print(f"[OK] {path} {method} -> {integ['type']}")
        except Exception as e:
            print(f"[FAIL] {path} {method} -> {str(e)}")
