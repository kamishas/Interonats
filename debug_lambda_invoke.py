
import boto3
import json
import base64

FUNCTION_NAME = "InteronSimpleService"
REGION = "us-east-1"
lambda_client = boto3.client('lambda', region_name=REGION)

payload = {
    "body": json.dumps({
        "action": "autocomplete",
        "query": "3730 jerman",
        "biasPosition": [-77.47519491866913, 38.905568794824404]
    }),
    "httpMethod": "POST" 
}

print("Invoking Lambda...")
response = lambda_client.invoke(
    FunctionName=FUNCTION_NAME,
    InvocationType='RequestResponse',
    LogType='Tail',
    Payload=json.dumps(payload)
)

print(f"Status: {response['StatusCode']}")
if 'LogResult' in response:
    print("--- LOGS ---")
    print(base64.b64decode(response['LogResult']).decode('utf-8'))
    print("--- END LOGS ---")

response_payload = json.loads(response['Payload'].read())
print("Response Payload:")
print(json.dumps(response_payload, indent=2))
