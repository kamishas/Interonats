import requests
import json
import boto3

# We can invoke Lambda via Function URL if configured, or boto3
# Since we have boto3 configured for deployment, invoking via boto3 is easiest to see logs.

def invoke_scanner():
    client = boto3.client('lambda', region_name='us-east-2')
    import base64
    
    print("Invoking BounceScannerLambda (IMAP)...")
    try:
        response = client.invoke(
            FunctionName='BounceScannerLambda',
            InvocationType='RequestResponse',
            LogType='Tail'
        )
        
        status = response['StatusCode']
        payload = response['Payload'].read().decode('utf-8')
        logs = base64.b64decode(response['LogResult']).decode('utf-8')
        
        print(f"Status: {status}")
        print(f"Payload: {payload}")
        print(f"\n--- EXECUTION LOGS ---\n{logs}")
        
    except Exception as e:
        print(f"Invocation Error: {e}")

if __name__ == "__main__":
    invoke_scanner()
