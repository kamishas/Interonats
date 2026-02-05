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
    
    # Testing the LEGACY function that Gateway likely points to
    func_name = 'ZohoAuthLambda' 
    
    print(f"Invoking {func_name}...")
    
    try:
        response = client.invoke(
            FunctionName=func_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        payload_resp = response['Payload'].read().decode('utf-8')
        print("Response:")
        print(payload_resp)
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == '__main__':
    test()
