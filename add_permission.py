
import boto3
import json

FUNCTION_NAME = "InteronGlobalAddressService"
REGION = "us-east-1"
lambda_client = boto3.client('lambda', region_name=REGION)

def add_permission():
    print(f"Modifying permission for {FUNCTION_NAME}...")
    try:
        lambda_client.remove_permission(
            FunctionName=FUNCTION_NAME,
            StatementId='FunctionURLPublicAccess'
        )
        print("Old permission removed.")
    except Exception:
        pass

    try:
        lambda_client.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId='FunctionURLPublicAccess',
            Action='lambda:InvokeFunctionUrl',
            Principal='*'
        )
        print("Permission added successfully.")
    except Exception as e:
        print(f"Error adding permission: {e}")

    # Verify
    try:
        policy = lambda_client.get_policy(FunctionName=FUNCTION_NAME)
        print("Policy presence confirmed.")
    except Exception as e:
        print(f"Could not retrieve policy: {e}")

if __name__ == "__main__":
    add_permission()
