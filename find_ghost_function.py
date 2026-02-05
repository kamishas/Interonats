import boto3

def find_target():
    # Use the ID directly from your logs
    api_id = 'x0ntz3akmd' 
    client = boto3.client('apigatewayv2', region_name='us-east-2')
    
    print(f"Investigating API: {api_id}")
    
    try:
        # Get Integrations for this API
        integrations = client.get_integrations(ApiId=api_id)
        
        for item in integrations['Items']:
            uri = item.get('IntegrationUri', 'No URI')
            print(f"Route Target: {uri}")
            
            # If it's a Lambda, extract the name
            if 'function:' in uri:
                # Format: arn:aws:lambda:region:account:function:NAME
                name = uri.split('function:')[-1]
                print(f"*** FOUND LAMBDA: {name} ***")
                
    except Exception as e:
        print(f"Error: {e}")
        # If not found in us-east-2, it might be in us-east-1?
        print("Checking us-east-1 just in case...")
        try:
             client_1 = boto3.client('apigatewayv2', region_name='us-east-1')
             client_1.get_api(ApiId=api_id)
             print("FOUND IN US-EAST-1! Use that region.")
        except:
             print("Not in us-east-1 either.")

if __name__ == '__main__':
    find_target()
