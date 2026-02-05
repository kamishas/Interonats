import boto3

def check_layers():
    client = boto3.client('lambda', region_name='us-east-2')
    try:
        resp = client.get_function_configuration(FunctionName='SendCampaignLambda')
        print("--- SendCampaignLambda Config ---")
        print(f"Runtime: {resp.get('Runtime')}")
        print(f"Layers: {resp.get('Layers', 'None')}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_layers()
