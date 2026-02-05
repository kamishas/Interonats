import boto3
import json

lambda_client = boto3.client('lambda', region_name='us-east-2')

CAMPAIGN_ID = '1767627369978'

event = {
    "pathParameters": {
        "campaignId": CAMPAIGN_ID
    },
    "requestContext": {
        "http": {
            "method": "POST"
        }
    }
}

print(f"Invoking SendCampaignLambda for {CAMPAIGN_ID}...")

try:
    response = lambda_client.invoke(
        FunctionName='SendCampaignLambda',
        InvocationType='RequestResponse',
        Payload=json.dumps(event)
    )
    
    payload = response['Payload'].read().decode('utf-8')
    print("\n--- RESPONSE PAYLOAD ---")
    print(payload)
    
    if 'FunctionError' in response:
        print(f"\n❌ FUNCTION ERROR: {response['FunctionError']}")

except Exception as e:
    print(f"Error invoking lambda: {str(e)}")
