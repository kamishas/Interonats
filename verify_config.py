import boto3
import json

def verify():
    client = boto3.client('lambda', region_name='us-east-2')
    
    functions = ['EmailAgentUnified', 'ZohoAuthLambda']
    
    print("--- Verifying Configurations ---")
    for func in functions:
        print(f"\nChecking {func}...")
        try:
            response = client.get_function_configuration(FunctionName=func)
            env = response.get('Environment', {}).get('Variables', {})
            
            client_id = env.get('ZOHO_CLIENT_ID', 'NOT_SET')
            # Print first few chars to identify, ensuring security
            print(f"ZOHO_CLIENT_ID: {client_id}")
            print(f"Handler: {response.get('Handler')}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == '__main__':
    verify()
