import boto3
import json

def test():
    client = boto3.client('lambda', region_name='us-east-2')
    
    payload = {
        "rawPath": "/auth/zoho/url",
        "httpMethod": "GET",
        "headers": {},
        "requestContext": {
            "http": {
                "method": "GET"
            }
        }
    }
    
    print("Invoking EmailAgentUnified...")
    
    response = client.invoke(
        FunctionName='EmailAgentUnified',
        InvocationType='RequestResponse',
        Payload=json.dumps(payload)
    )
    
    payload = response['Payload'].read().decode('utf-8')
    print("Response:")
    print(payload)

if __name__ == '__main__':
    test()
