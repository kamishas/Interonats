import boto3
import json
import os
import re

# Config
REGION = 'us-east-2'
FRONTEND_PATH = r"C:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src"
LAMBDA_FUNCTIONS = [
    "ManageRecipientsLambda",
    "SendCampaignLambda",
    "BounceScannerLambda",
    "GetCampaignsLambda",
    "GetCampaignStatsLambda", 
    "GetContactsLambda",
    "AddContactLambda",
    "GetTagsLambda",
    "GenerateEmailLambda",
    "ConfigureCampaignLambda", # Check if this exists/is used
    "ListCampaignsLambda" # Check alias
]

def scan_frontend_endpoints():
    print("--- Scanning Frontend API Endpoints ---")
    api_config_path = os.path.join(FRONTEND_PATH, "config", "api.ts")
    if os.path.exists(api_config_path):
        with open(api_config_path, 'r') as f:
            content = f.read()
            # Simple regex to find path definitions
            matches = re.findall(r"(\w+):\s*['\"]([^'\"]+)['\"]", content)
            for name, path in matches:
                print(f"Frontend Config: {name} -> {path}")
    else:
        print(f"Warning: {api_config_path} not found.")

def scan_lambda_functions():
    print("\n--- Scanning AWS Lambda Functions ---")
    client = boto3.client('lambda', region_name=REGION)
    try:
        paginator = client.get_paginator('list_functions')
        for page in paginator.paginate():
            for func in page['Functions']:
                f_name = func['FunctionName']
                if f_name in LAMBDA_FUNCTIONS or "Interon" in f_name or "Campaign" in f_name:
                    print(f"Lambda: {f_name} | Runtime: {func['Runtime']} | LastMod: {func['LastModified']}")
    except Exception as e:
        print(f"Error scanning Lambdas: {e}")

def scan_api_gateway():
    print("\n--- Scanning API Gateway Routes (HTTP API) ---")
    client = boto3.client('apigatewayv2', region_name=REGION)
    try:
        apis = client.get_apis()
        for api in apis['Items']:
            print(f"API: {api['Name']} ({api['ApiId']})")
            routes = client.get_routes(ApiId=api['ApiId'])
            for route in routes['Items']:
                target = route.get('Target', 'No Target')
                # Clean up target string to show just function name if possible
                if 'arn:aws:lambda' in target:
                     target = target.split(':function:')[-1].split('/')[0]
                print(f"  Route: {route['RouteKey']} -> {target}")
    except Exception as e:
        print(f"Error scanning API Gateway: {e}")

def scan_dynamodb_tables():
    print("\n--- Scanning DynamoDB Tables ---")
    client = boto3.client('dynamodb', region_name=REGION)
    try:
        tables = client.list_tables()
        for t in tables['TableNames']:
            if "Campaign" in t or "Contact" in t:
                desc = client.describe_table(TableName=t)
                schema = desc['Table']['KeySchema']
                count = desc['Table']['ItemCount']
                print(f"Table: {t} | Items: {count} | Schema: {schema}")
    except Exception as e:
        print(f"Error scanning DynamoDB: {e}")

if __name__ == "__main__":
    scan_frontend_endpoints()
    scan_lambda_functions()
    scan_api_gateway()
    scan_dynamodb_tables()
