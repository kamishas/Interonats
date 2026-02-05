import boto3

def scan_apis():
    client = boto3.client('apigatewayv2', region_name='us-east-2')
    
    print("--- Scanning Integrations of Account APIs ---")
    try:
        apis = client.get_apis()['Items']
        for api in apis:
            api_id = api['ApiId']
            name = api['Name']
            print(f"Checking API: {name} ({api_id})")
            
            try:
                # Check for EmailAgentUnified or Zoho related routes
                integrations = client.get_integrations(ApiId=api_id)['Items']
                for item in integrations:
                    uri = item.get('IntegrationUri', '')
                    if 'EmailAgentUnified' in uri:
                        print(f"!!! FOUND MATCH !!! API: {name} ({api_id}) -> EmailAgentUnified")
                    elif 'ZohoAuthLambda' in uri:
                         print(f"!!! FOUND LEGACY MATCH !!! API: {name} ({api_id}) -> ZohoAuthLambda")
            except Exception as e:
                print(f"  Error checking integrations: {e}")
            print("-" * 10)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    scan_apis()
