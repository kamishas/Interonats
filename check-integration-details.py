import boto3
import json

client = boto3.client('apigateway', region_name='us-east-2')
API_ID = '5cs5faz106'

def get_resources():
    print(f"Fetching Resources for API: {API_ID}")
    items = client.get_resources(restApiId=API_ID, limit=500)['items']
    
    # Find /campaigns/{campaignId}/recipients
    for item in items:
        path = item.get('path')
        if 'recipients' in path:
            print(f"\nPath: {path} (ID: {item['id']})")
            methods = item.get('resourceMethods', {})
            for method, config in methods.items():
                print(f"  Method: {method}")
                # Get Integration
                try:
                    integ = client.get_integration(
                        restApiId=API_ID,
                        resourceId=item['id'],
                        httpMethod=method
                    )
                    uri = integ.get('uri', 'No URI')
                    # Parse Lambda Name from URI
                    # arn:aws:apigateway:region:lambda:path/2015-03-31/functions/arn:aws:lambda:region:account:function:NAME/invocations
                    if 'function:' in uri:
                        func_name = uri.split('function:')[-1].split('/')[0]
                        print(f"    -> Lambda: {func_name}")
                    else:
                        print(f"    -> URI: {uri}")
                except Exception as e:
                    print(f"    -> Error parsing integration: {e}")

if __name__ == "__main__":
    get_resources()
