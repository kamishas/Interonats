import boto3
import json

lambda_client = boto3.client('lambda', region_name='us-east-2')

def scan():
    print("Triggering Bound Scanner...")
    try:
        # Invoke Scanner with OPTIONS mock to ensure clean run
        resp = lambda_client.invoke(
            FunctionName='BounceScannerLambda',
            Payload=json.dumps({"httpMethod": "POST"})
        )
        payload = resp['Payload'].read().decode('utf-8')
        result = json.loads(payload)
        
        print("\n--- Scan Result ---")
        print(f"Status: {result.get('statusCode')}")
        body = json.loads(result.get('body', '{}'))
        print(f"Processed: {body.get('processed')} messages")
        print(f"Bounces Found: {body.get('bounces')}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scan()
