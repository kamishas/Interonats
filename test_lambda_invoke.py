import boto3
import json
import base64

def test_invoke():
    print("Invoking Lambda directly...")
    client = boto3.client('lambda', region_name='us-east-2')
    
    try:
        response = client.invoke(
            FunctionName='AddressVerificationLambda',
            InvocationType='RequestResponse',
            Payload=json.dumps({"action": "autocomplete", "query": "123"})
        )
        
        print(f"StatusCode: {response['StatusCode']}")
        if 'FunctionError' in response:
            print(f"FunctionError: {response['FunctionError']}")
            
        payload = response['Payload'].read().decode('utf-8')
        print(f"Payload: {payload}")
        
        # Check logs if available (LogType='Tail' requires base64 decode)
        # But we didn't request them to keep it simple.
        
    except Exception as e:
        print(f"Invocation Failed: {e}")

if __name__ == "__main__":
    test_invoke()
