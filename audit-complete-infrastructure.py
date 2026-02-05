import boto3
import json

print("="*80)
print("COMPLETE INFRASTRUCTURE AUDIT - us-east-2")
print("="*80)

region = 'us-east-2'

# 1. DynamoDB Tables
print("\n1. DYNAMODB TABLES")
print("-"*80)
dynamodb = boto3.client('dynamodb', region_name=region)
try:
    tables = dynamodb.list_tables()
    print(f"Total tables: {len(tables['TableNames'])}")
    for table in tables['TableNames']:
        if 'Campaign' in table or 'Contact' in table:
            print(f"  ✅ {table}")
            # Get table details
            desc = dynamodb.describe_table(TableName=table)
            print(f"     Status: {desc['Table']['TableStatus']}")
            print(f"     Items: {desc['Table'].get('ItemCount', 'N/A')}")
except Exception as e:
    print(f"  ❌ Error: {e}")

# 2. Lambda Functions
print("\n2. LAMBDA FUNCTIONS")
print("-"*80)
lambda_client = boto3.client('lambda', region_name=region)
try:
    functions = lambda_client.list_functions()
    campaign_funcs = [f for f in functions['Functions'] if 'Campaign' in f['FunctionName'] or 'Contact' in f['FunctionName'] or 'Recipient' in f['FunctionName']]
    print(f"Total relevant functions: {len(campaign_funcs)}")
    for func in campaign_funcs:
        print(f"  ✅ {func['FunctionName']}")
        print(f"     Runtime: {func['Runtime']}")
        print(f"     Role: {func['Role'].split('/')[-1]}")
except Exception as e:
    print(f"  ❌ Error: {e}")

# 3. API Gateways
print("\n3. API GATEWAYS")
print("-"*80)
apigw = boto3.client('apigatewayv2', region_name=region)
try:
    apis = apigw.get_apis()
    print(f"Total APIs: {len(apis['Items'])}")
    for api in apis['Items']:
        print(f"  API: {api['Name']} ({api['ApiId']})")
        print(f"     Endpoint: {api['ApiEndpoint']}")
        print(f"     Protocol: {api['ProtocolType']}")
        
        # Get routes
        routes = apigw.get_routes(ApiId=api['ApiId'])
        print(f"     Routes: {len(routes['Items'])}")
        
        # Get CORS
        cors = api.get('CorsConfiguration', {})
        if cors:
            print(f"     CORS Origins: {cors.get('AllowOrigins', 'NOT SET')}")
            print(f"     CORS Methods: {cors.get('AllowMethods', 'NOT SET')}")
        else:
            print(f"     CORS: NOT CONFIGURED")
except Exception as e:
    print(f"  ❌ Error: {e}")

# 4. IAM Roles
print("\n4. IAM ROLES FOR LAMBDA")
print("-"*80)
iam = boto3.client('iam')
try:
    roles = iam.list_roles()
    lambda_roles = [r for r in roles['Roles'] if 'lambda' in r['RoleName'].lower() or 'email' in r['RoleName'].lower()]
    print(f"Total Lambda roles: {len(lambda_roles)}")
    for role in lambda_roles:
        print(f"  ✅ {role['RoleName']}")
        print(f"     ARN: {role['Arn']}")
        
        # Get attached policies
        try:
            policies = iam.list_attached_role_policies(RoleName=role['RoleName'])
            for policy in policies['AttachedPolicies']:
                print(f"     Policy: {policy['PolicyName']}")
        except:
            pass
except Exception as e:
    print(f"  ❌ Error: {e}")

print("\n" + "="*80)
print("AUDIT COMPLETE")
print("="*80)
