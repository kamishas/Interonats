import boto3

def list_apis():
    client = boto3.client('apigatewayv2', region_name='us-east-2')
    
    print("--- Listing HTTP APIs ---")
    try:
        response = client.get_apis()
        for item in response['Items']:
            print(f"ID: {item['ApiId']}")
            print(f"Name: {item['Name']}")
            print(f"Endpoint: {item['ApiEndpoint']}")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    list_apis()
