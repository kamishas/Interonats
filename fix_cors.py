
import boto3
import json

FUNCTION_NAME = "InteronGlobalAddressService"
REGION = "us-east-1"
lambda_client = boto3.client('lambda', region_name=REGION)

def fix_cors():
    try:
        # Get current URL
        response = lambda_client.get_function_url_config(FunctionName=FUNCTION_NAME)
        url = response['FunctionUrl']
        print(f"Found URL: {url}")
        
        # Try updating CORS - Minimal
        print("Applying Minimal CORS...")
        lambda_client.update_function_url_config(
            FunctionName=FUNCTION_NAME,
            Cors={'AllowOrigins': ['*']}
        )
        print("Minimal CORS applied.")
        
        # Try Full CORS
        print("Applying Full CORS...")
        lambda_client.update_function_url_config(
            FunctionName=FUNCTION_NAME,
            Cors={
                'AllowOrigins': ['*'],
                'AllowMethods': ['POST', 'OPTIONS'],
                'AllowHeaders': ['Content-Type', 'Authorization'],
                'MaxAge': 86400
            }
        )
        print("Full CORS applied.")
        
        with open("deployed_url.txt", "w") as f:
            f.write(url)
            
    except Exception as e:
        print(f"CORS Fix Failed: {e}")

if __name__ == "__main__":
    fix_cors()
