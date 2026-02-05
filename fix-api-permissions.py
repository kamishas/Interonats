import boto3
import time

API_ID = "5cs5faz106"
REGION = "us-east-2"
ACCOUNT_ID = boto3.client('sts').get_caller_identity()['Account']

lambdas = [
    "ListCampaignsLambda",
    "CreateCampaignLambda",
    "GetCampaignLambda",
    "UpdateCampaignLambda",
    "SendCampaignLambda",
    "BounceScannerLambda",
    "ImportRecipientsLambda",
    "ManageRecipientsLambda", # Missed this one!
    "ConfigureCampaignLambda",
    "GenerateEmailLambda",
    "ImageComplianceLambda",
    "ImageUploadLambda",
    "ListContactsLambda",
    "AddContactLambda",
    "ManageContactsLambda",
    "ValidateContactsLambda",
    "BatchSaveContactsLambda",
    "CreateContactTagLambda",
    "ListContactTagsLambda",
    "DeleteContactLambda"
]

lambda_client = boto3.client('lambda', region_name=REGION)

def add_permission(func_name):
    # We want to allow ANY method on ANY path for this API to be safe/broad
    # SourceArn: arn:aws:execute-api:region:account:api-id/*/*/*
    
    source_arn = f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{API_ID}/*/*/*"
    stmt_id = f"api-invoke-{API_ID}-{int(time.time())}"
    
    try:
        print(f"[{func_name}] Adding permission...")
        lambda_client.add_permission(
            FunctionName=func_name,
            StatementId=stmt_id,
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=source_arn
        )
        print(f"[{func_name}] ✅ Permission Added.")
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"[{func_name}] ⚠️ Function not found (Skipping).")
    except lambda_client.exceptions.ResourceConflictException:
        print(f"[{func_name}] ℹ️ Permission likely exists (Conflict).")
    except Exception as e:
        print(f"[{func_name}] ❌ Error: {e}")

if __name__ == "__main__":
    print(f"Fixing Permissions for API: {API_ID}")
    for l in lambdas:
        add_permission(l)
