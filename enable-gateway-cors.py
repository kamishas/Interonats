import boto3

client = boto3.client('apigateway', region_name='us-east-2')
api_id = '5cs5faz106'

print(f"Configuring Gateway Responses for {api_id}...")

response_params = {
    'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
    'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
    'gatewayresponse.header.Access-Control-Allow-Methods': "'POST,OPTIONS'"
}

# 4XX
try:
    client.put_gateway_response(
        restApiId=api_id,
        responseType='DEFAULT_4XX',
        responseParameters=response_params
    )
    print("DEFAULT_4XX Configured.")
except Exception as e:
    print(f"Error 4XX: {e}")

# 5XX
try:
    client.put_gateway_response(
        restApiId=api_id,
        responseType='DEFAULT_5XX',
        responseParameters=response_params
    )
    print("DEFAULT_5XX Configured.")
except Exception as e:
    print(f"Error 5XX: {e}")

# Deploy
print("Redeploying API...")
try:
    client.create_deployment(
        restApiId=api_id,
        stageName='prod'
    )
    print("API Deployed!")
except Exception as e:
    print(f"Error Deploy: {e}")
