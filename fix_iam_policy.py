
import boto3
import json
import time

ROLE_NAME = "InteronSimpleRole"
REGION = "us-east-1"
iam = boto3.client('iam', region_name=REGION)

def fix_policy():
    print(f"Updating policy for {ROLE_NAME}...")
    
    # Updated policy with necessary permissions for Autocomplete and GetPlace
    new_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "geo:SearchPlaceIndexForText",
                    "geo:SearchPlaceIndexForSuggestions",
                    "geo:GetPlace"
                ],
                "Resource": "*" 
            }
        ]
    }
    
    try:
        iam.put_role_policy(
            RoleName=ROLE_NAME,
            PolicyName="Loc",
            PolicyDocument=json.dumps(new_policy)
        )
        print("Permissions updated successfully.")
        print("Allowed: SearchPlaceIndexForSuggestions, GetPlace")
    except Exception as e:
        print(f"Error updating policy: {e}")

if __name__ == "__main__":
    fix_policy()
