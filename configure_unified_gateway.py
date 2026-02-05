import boto3
import json
import time

def configure_gateway():
    apigw = boto3.client('apigateway', region_name='us-east-2')
    lambda_client = boto3.client('lambda', region_name='us-east-2')
    
    api_id = 'x0ntz3akmd'
    unified_lambda_name = 'EmailAgentUnified'
    
    # Get Root ID
    resources = apigw.get_resources(restApiId=api_id)['items']
    root_id = [r['id'] for r in resources if r['path'] == '/'][0]
    print(f"Root ID: {root_id}")
    
    # Get Lambda ARN
    fn = lambda_client.get_function(FunctionName=unified_lambda_name)
    lambda_arn = fn['Configuration']['FunctionArn']
    # Constructed ARN for APIGW integration
    # arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambdaArn}/invocations
    region = 'us-east-2'
    account_id = lambda_arn.split(':')[4]
    integration_uri = f"arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
    
    print(f"Target Lambda: {lambda_arn}")
    
    # Routes to create/update
    routes = ['contacts', 'campaigns', 'images', 'compliance', 'ai', 'auth'] 
    # Note: 'auth' is tricky if onehr-login handles it. 
    # But EmailAgentUnified handles /auth/zoho. 
    # onehr handles /login (root? or /auth/login?)
    # Frontend calls /auth/login (Login.tsx:165 in app.py). 
    # app.py has @app.post("/login")... wait.
    # inspect_apigw output showed /{proxy+} -> onehr-login-api-v2.
    # If I add /auth, it captures /auth/login too?
    # onehr-login-api v2 app.py has: @app.post("/login") and @app.post("/auth/login").
    # If I point /auth to Unified, I break login IF Unified doesn't handle /auth/login.
    # Unified handles /auth/zoho. 
    # So I should handle /auth/zoho specifically or let Unified proxy /auth/* and fallthrough?
    # Safer: Create /contacts, /campaigns, etc. Leave /auth alone for now IF `onehr` handles it via Proxy.
    # But wait, Unified needs /auth/zoho.
    # I will create /contacts, /campaigns, /images, /compliance, /ai.
    # For /auth, I'll risk it? No, user said "login failed" before.
    # If I fix /contacts, login works (via onehr-login-api proxy).
    
    # Updated Targets
    targets = ['contacts', 'campaigns', 'images', 'compliance', 'ai']
    
    # helper to get or create resource
    def get_or_create(parent_id, path_part):
        # Refresh resources list logic is tricky without re-fetching.
        # But we can try create and catch conflict?
        # Better: Re-fetch resources each time or cache efficiently?
        # Let's simple try/except create.
        try:
             resp = apigw.create_resource(restApiId=api_id, parentId=parent_id, pathPart=path_part)
             return resp['id'], True
        except Exception as e:
             # Assume exists, find it
             # Limitation: verifying it exists strictly under parent_id
             # For this script, assume standard structure or fetch
             current_res = apigw.get_resources(restApiId=api_id, limit=500)['items']
             for r in current_res:
                 if r.get('parentId') == parent_id and r.get('pathPart') == path_part:
                     return r['id'], False
             raise e

    for target in targets:
        print(f"Configuring /{target}...")
        # 1. Base Resource
        res_id, _ = get_or_create(root_id, target)
        
        # Method ANY
        apigw.put_method(restApiId=api_id, resourceId=res_id, httpMethod='ANY', authorizationType='NONE')
        apigw.put_integration(restApiId=api_id, resourceId=res_id, httpMethod='ANY', type='AWS_PROXY', integrationHttpMethod='POST', uri=integration_uri)
        
        try:
            lambda_client.add_permission(FunctionName=unified_lambda_name, StatementId=f"apigw-{target}-base", Action="lambda:InvokeFunction", Principal="apigateway.amazonaws.com", SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/*/{target}")
        except: pass

        # 2. Proxy Child /{target}/{proxy+}
        proxy_id, _ = get_or_create(res_id, '{proxy+}')
        
        apigw.put_method(restApiId=api_id, resourceId=proxy_id, httpMethod='ANY', authorizationType='NONE')
        apigw.put_integration(restApiId=api_id, resourceId=proxy_id, httpMethod='ANY', type='AWS_PROXY', integrationHttpMethod='POST', uri=integration_uri)
        
        try:
            lambda_client.add_permission(FunctionName=unified_lambda_name, StatementId=f"apigw-{target}-proxy", Action="lambda:InvokeFunction", Principal="apigateway.amazonaws.com", SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/*/{target}/*")
        except: pass
        
        print(f"Done /{target} (+proxy)")

    # DEPLOY
    print("Deploying...")
    apigw.create_deployment(restApiId=api_id, stageName='prod')
    print("Deployed.")

if __name__ == '__main__':
    configure_gateway()
