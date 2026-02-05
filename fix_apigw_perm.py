
import boto3
FUNCTION_NAME = "InteronSimpleService"
REGION = "us-east-1"
API_ID = "7a8in913p9" # From logs
lambda_client = boto3.client('lambda', region_name=REGION)
sts = boto3.client('sts', region_name=REGION)

def fix_perm():
    account_id = sts.get_caller_identity()['Account']
    # Remove old
    try:
        lambda_client.remove_permission(FunctionName=FUNCTION_NAME, StatementId=f"apigateway-invoke-{API_ID}")
        print("Removed old permission.")
    except: pass
    
    # Add new broad
    lambda_client.add_permission(
        FunctionName=FUNCTION_NAME,
        StatementId=f"apigateway-invoke-{API_ID}",
        Action='lambda:InvokeFunction',
        Principal='apigateway.amazonaws.com',
        SourceArn=f"arn:aws:execute-api:{REGION}:{account_id}:{API_ID}/*" 
    )
    print("Added broad permission.")

if __name__ == "__main__":
    fix_perm()
