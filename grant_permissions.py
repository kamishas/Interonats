import boto3
import sys

def grant_permissions(function_name):
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    iam_client = boto3.client('iam', region_name='us-east-2')
    
    try:
        # Get function configuration to find Role ARN
        print(f"Fetching config for {function_name}...")
        response = lambda_client.get_function_configuration(FunctionName=function_name)
        role_arn = response['Role']
        role_name = role_arn.split('/')[-1]
        print(f"Role found: {role_name}")
        
        # List current policies
        print("Current policies:")
        attached = iam_client.list_attached_role_policies(RoleName=role_name)
        for p in attached['AttachedPolicies']:
            print(f" - {p['PolicyName']}")
        
        # Policies to attach
        policies = [
            'arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess',
            'arn:aws:iam::aws:policy/SecretsManagerReadWrite',
             # Add KMS just in case (AWSManagedPolicy)
            'arn:aws:iam::aws:policy/AWSKeyManagementServicePowerUser',
            'arn:aws:iam::aws:policy/AmazonS3FullAccess',
            'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess'
        ]
        
        for policy_arn in policies:
            print(f"Attaching {policy_arn}...")
            try:
                iam_client.attach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy_arn
                )
                print("Attached successfully.")
            except Exception as e:
                print(f"Failed to attach {policy_arn}: {e}")
                
    except Exception as e:
        print(f"Error processing {function_name}: {e}")

if __name__ == "__main__":
    functions = ['ListContactsLambda', 'AddContactLambda', 'EmailAgentUnified']
    for f in functions:
        grant_permissions(f)
