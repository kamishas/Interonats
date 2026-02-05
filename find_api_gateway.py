import boto3

def find_integration():
    client = boto3.client('apigatewayv2', region_name='us-east-2')
    
    target_api_id = 'x0ntz3akmd'
    
    print(f"--- Investigating API: {target_api_id} ---")
    
    try:
        # 1. Verify API exists
        api = client.get_api(ApiId=target_api_id)
        print(f"API Name: {api.get('Name')}")
        print(f"API Endpoint: {api.get('ApiEndpoint')}")
        
        # 2. Get Integrations
        print("\n--- Integrations ---")
        integrations = client.get_integrations(ApiId=target_api_id)
        
        for item in integrations['Items']:
            print(f"IntegrationId: {item['IntegrationId']}")
            print(f"IntegrationType: {item['IntegrationType']}")
            print(f"TargetArn: {item.get('IntegrationUri')}") # For Lambda, URI contains the ARN
            
            # Extract Function Name if possible
            if item.get('IntegrationUri'):
                # arn:aws:lambda:us-east-2:account:function:FunctionName
                parts = item['IntegrationUri'].split(':')
                if 'function' in parts:
                    func_name = parts[parts.index('function') + 1]
                    print(f"MATCHED FUNCTION: {func_name}")
            print("-" * 20)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    find_integration()
