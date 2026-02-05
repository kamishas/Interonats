import boto3

client = boto3.client('lambda', region_name='us-east-2')

try:
    print("Deleting AddressVerificationLambda...")
    client.delete_function(FunctionName='AddressVerificationLambda')
    print("Deleted.")
except Exception as e:
    print(f"Error (ignored): {e}")
