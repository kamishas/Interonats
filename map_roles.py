import json
import subprocess

def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return json.loads(result.stdout)
    except:
        return {}

try:
    # Try different encodings
    try:
        with open('roles_list.json', encoding='utf-16') as f:
            data = json.load(f)
    except:
        with open('roles_list.json', encoding='utf-8') as f:
            data = json.load(f)

    print("Project Roles & Policies:")
    print("-------------------------")
    
    for role in data['Roles']:
        role_name = role['RoleName']
        # Filter for relevant roles (Lambda execution roles typically)
        if 'Lambda' in role_name or 'Interon' in role_name or 'Email' in role_name:
            print(f"\n[Role] {role_name}")
            
            # Get attached policies
            cmd = f"aws iam list-attached-role-policies --role-name {role_name} --no-cli-pager"
            policies = run_command(cmd)
            
            if policies.get('AttachedPolicies'):
                for policy in policies['AttachedPolicies']:
                    print(f"  - Policy: {policy['PolicyName']} (ARN: {policy['PolicyArn']})")
            else:
                print("  - No attached managed policies")

except Exception as e:
    print(f"Error: {e}")
