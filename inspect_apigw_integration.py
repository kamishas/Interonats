import boto3
import json

def inspect_integration():
    client = boto3.client('apigateway', region_name='us-east-2')
    api_id = 'x0ntz3akmd'
    
    print(f"Inspecting API: {api_id}")
    resources = client.get_resources(restApiId=api_id)['items']
    
    for res in resources:
        print(f"PATH: {res.get('path')} (ID: {res['id']})")
    if 'resourceMethods' in res:
        for method in res['resourceMethods']:
            try:
                integration = client.get_integration(restApiId=api_id, resourceId=res['id'], httpMethod=method)
                uri = integration.get('uri', '')
                func = uri.split(':function:')[-1].split('/invocations')[0] if ':function:' in uri else uri
                print(f"  {method} -> {func}")
            except:
                print(f"  {method} -> ERROR")

if __name__ == '__main__':
    inspect_integration()
