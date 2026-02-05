import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
api_id = '5cs5faz106'

def get_resources_tree(api_id):
    resources = client.get_resources(restApiId=api_id, embed=['methods'])
    items = resources['items']
    target_paths = ['/auth', '/auth/zoho', '/auth/zoho/url', '/auth/zoho/token']
    found_paths = {p: False for p in target_paths}
    
    with open('gateway_tree.txt', 'w') as f:
        for item in items:
            path = item.get('path', 'UNKNOWN')
            methods = list(item.get('resourceMethods', {}).keys())
            f.write(f"{path} ({item['id']}) {methods}\n")

if __name__ == '__main__':
    get_resources_tree(api_id)
