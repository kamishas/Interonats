import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
api_id = '5cs5faz106'

def list_resources():
    print(f"Listing resources for API {api_id}...")
    try:
        resources = client.get_resources(restApiId=api_id, limit=500)['items']
        for r in resources:
            path = r.get('path')
            if '/ai' in path:
                print(f"Found AI Resource: {path} (ID: {r['id']})")
                methods = list(r.get('resourceMethods', {}).keys())
                print(f"  Methods: {methods}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_resources()
