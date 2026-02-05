import boto3
import json
import subprocess
import sys

def run_aws_cmd(args):
    """Run AWS CLI command and return JSON."""
    cmd = ['aws'] + args + ['--output', 'json', '--no-cli-pager']
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error running command {' '.join(cmd)}: {e.stderr}")
        return None

def get_resources(api_id):
    """Get all resources for an API."""
    print(f"Fetching resources for API: {api_id}...")
    return run_aws_cmd(['apigateway', 'get-resources', '--rest-api-id', api_id])

def get_integration(api_id, resource_id, method):
    """Get integration details for a method."""
    return run_aws_cmd(['apigateway', 'get-integration', '--rest-api-id', api_id, '--resource-id', resource_id, '--http-method', method])

def get_lambda_config(function_name):
    """Get Lambda configuration and policy."""
    print(f"  Checking Lambda: {function_name}...")
    config = run_aws_cmd(['lambda', 'get-function', '--function-name', function_name])
    policy = run_aws_cmd(['lambda', 'get-policy', '--function-name', function_name])
    return config, policy

def audit_api(api_id, api_name):
    print(f"\n--- Auditing {api_name} ({api_id}) ---")
    resources = get_resources(api_id)
    if not resources:
        return

    for item in resources.get('items', []):
        path = item.get('path')
        methods = item.get('resourceMethods', {}).keys()
        
        for method in methods:
            if method == 'OPTIONS': continue # Skip CORS preflight for brevity
            
            integration = get_integration(api_id, item['id'], method)
            if not integration:
                continue

            uri = integration.get('uri', '')
            if 'lambda' in uri:
                # Extract function name from ARN
                # arn:aws:apigateway:region:lambda:path/2015-03-31/functions/arn:aws:lambda:region:account:function:NAME/invocations
                try:
                    function_arn = uri.split('functions/')[1].split('/invocations')[0]
                    function_name = function_arn.split(':')[-1]
                    
                    config, policy = get_lambda_config(function_name)
                    
                    env_vars = config.get('Configuration', {}).get('Environment', {}).get('Variables', {})
                    role_arn = config.get('Configuration', {}).get('Role')
                    
                    print(f"Endpoint: {method} {path}")
                    print(f"  -> Lambda: {function_name}")
                    print(f"  -> Role: {role_arn.split('/')[-1]}")
                    print(f"  -> Env Vars: {json.dumps(env_vars, indent=2)}")
                    
                    # Check Policy (Resource-based)
                    has_permission = False
                    if policy:
                        statements = json.loads(policy.get('Policy', '{}')).get('Statement', [])
                        for stmt in statements:
                            if stmt.get('Action') == 'lambda:InvokeFunction' and 'apigateway.amazonaws.com' in stmt.get('Principal', {}).get('Service', ''):
                                has_permission = True
                                break
                    print(f"  -> API Gateway Permission: {'✅ Granted' if has_permission else '❌ MISSING'}")

                except Exception as e:
                    print(f"  -> Error parsing Lambda details: {e}")
            else:
                print(f"Endpoint: {method} {path} -> Type: {integration.get('type')}")

if __name__ == "__main__":
    audit_api('9tesg7rn8j', 'onehr-login-api')
    audit_api('5cs5faz106', 'EmailAgentAPI')
