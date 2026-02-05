import boto3
import json
import os
import re
from datetime import datetime

# Config
REGION = 'us-east-2'
OUTPUT_FILE = r"C:\Users\kamin\.gemini\antigravity\brain\69c4bea5-9e68-4c85-9349-de91d252aa21\system_architecture.md"
FRONTEND_PATH = r"C:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src"

def get_frontend_endpoints():
    endpoints = {}
    api_config_path = os.path.join(FRONTEND_PATH, "config", "api.ts")
    if os.path.exists(api_config_path):
        with open(api_config_path, 'r') as f:
            content = f.read()
            # regex for key: 'value'
            matches = re.findall(r"(\w+):\s*['\"]([^'\"]+)['\"]", content)
            for name, path in matches:
                endpoints[name] = path
    return endpoints

def get_lambdas():
    client = boto3.client('lambda', region_name=REGION)
    lambdas = []
    paginator = client.get_paginator('list_functions')
    for page in paginator.paginate():
        for func in page['Functions']:
            if "Interon" in func['FunctionName'] or "Campaign" in func['FunctionName'] or "Lambda" in func['FunctionName']:
                 lambdas.append({
                     "Name": func['FunctionName'],
                     "Runtime": func['Runtime'],
                     "LastModified": func['LastModified']
                 })
    return lambdas

def get_api_gateway_routes():
    client = boto3.client('apigatewayv2', region_name=REGION)
    routes_map = []
    apis = client.get_apis()
    for api in apis['Items']:
        api_id = api['ApiId']
        api_name = api['Name']
        api_endpoint = api.get('ApiEndpoint', 'N/A')
        
        # Fetch Integrations to map ID -> ARN
        integrations = {}
        try:
             ints = client.get_integrations(ApiId=api_id)
             for i in ints['Items']:
                 # IntegrationUri usually contains the Lambda ARN
                 # e.g. arn:aws:lambda:us-east-2:123456:function:MyFunction
                 uri = i.get('IntegrationUri', '')
                 if 'function:' in uri:
                     func_name = uri.split(':function:')[-1].split('/')[0]
                     integrations[i['IntegrationId']] = func_name
                 else:
                     integrations[i['IntegrationId']] = "Non-Lambda Target"
        except:
            print(f"Computed integrations for {api_name} failed")

        routes = client.get_routes(ApiId=api_id)
        for route in routes['Items']:
            target = route.get('Target', 'No Target')
            target_name = target
            
            # Resolve "integrations/xyz" to function name
            if 'integrations/' in target:
                int_id = target.split('/')[-1]
                target_name = integrations.get(int_id, target)
            elif 'arn:aws:lambda' in target:
                 target_name = target.split(':function:')[-1].split('/')[0]
            
            routes_map.append({
                "ApiName": api_name,
                "ApiId": api_id,
                "Endpoint": api_endpoint,
                "RouteKey": route['RouteKey'], # e.g. "POST /send"
                "Target": target_name
            })
    return routes_map

def get_dynamodb_tables():
    client = boto3.client('dynamodb', region_name=REGION)
    tables_info = []
    tables = client.list_tables()
    for t in tables['TableNames']:
        if "Campaign" in t or "Contact" in t or "Interon" in t:
            desc = client.describe_table(TableName=t)
            pk = [k['AttributeName'] for k in desc['Table']['KeySchema'] if k['KeyType'] == 'HASH'][0]
            sk = next((k['AttributeName'] for k in desc['Table']['KeySchema'] if k['KeyType'] == 'RANGE'), None)
            
            tables_info.append({
                "Name": t,
                "PK": pk,
                "SK": sk
            })
    return tables_info

def generate_markdown(endpoints, lambdas, routes, tables):
    md = "# Interon Email Agent: System Architecture & Low Level Flow\n\n"
    md += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"

    md += "## 1. High Level Architecture\n"
    md += "The system is a Serverless Email Marketing Platform using **React (Frontend)**, **API Gateway (Ingress)**, **AWS Lambda (Compute)**, and **DynamoDB (Storage)**.\n"
    md += "External integration with **Zoho Mail** handles SMTP sending and IMAP bounce detection.\n\n"

    md += "## 2. API Route Map (The 'Nervous System')\n"
    md += "Mapping Frontend Actions -> API Gateway Routes -> Lambda Functions.\n\n"
    md += "| Frontend Action | API Route | Target Lambda | Status |\n"
    md += "| :--- | :--- | :--- | :--- |\n"
    
    # Analyze connections
    connected_lambdas = set()
    connected_routes = set()

    # Try to map routes to frontend
    for r in routes:
        route_key = r['RouteKey']
        target = r['Target']
        connected_lambdas.add(target)
        
        # Check if used in frontend
        frontend_ref = "Unused/Hidden"
        for k, v in endpoints.items():
            # v might be "/campaigns" and route might be "GET /campaigns"
            path_part = route_key.split(' ')[-1]
            if path_part == v or (v and path_part.startswith(v)):
                frontend_ref = f"`{k}`"
        
        md += f"| {frontend_ref} | `{route_key}` | `{target}` | ✅ |\n"

    md += "\n> [!NOTE]\n> Routes marked 'Unused/Hidden' are accessible via API Gateway but not explicitly defined in `api.ts` constants (or are dynamic).\n\n"

    md += "## 3. Storage Schema (DynamoDB)\n\n"
    for t in tables:
        md += f"### Table: `{t['Name']}`\n"
        md += f"- **Partition Key (PK):** `{t['PK']}`\n"
        if t['SK']:
            md += f"- **Sort Key (SK):** `{t['SK']}`\n"
        md += "\n"

    md += "## 4. Lambda Function Inventory\n\n"
    md += "| Function Name | Runtime | Triggers found? |\n"
    md += "| :--- | :--- | :--- |\n"
    for l in lambdas:
        is_triggered = "Yes" if l['Name'] in connected_lambdas else "**NO (Orphan)**"
        md += f"| `{l['Name']}` | {l['Runtime']} | {is_triggered} |\n"

    md += "\n## 5. Loose Ends & Analysis\n"
    orphans = [l['Name'] for l in lambdas if l['Name'] not in connected_lambdas]
    if orphans:
        md += "### ⚠️ Orphaned Lambda Functions\n"
        md += "The following functions do not appear to be connected to the API Gateway (HTTP API). They might be utility functions, triggers (like DynamoDB Streams), or deprecated.\n"
        for o in orphans:
            md += f"- `{o}`\n"
    else:
        md += "No orphaned Lambda functions detected.\n"
        
    md += "\n## 6. Bounce Handling Flow (Detailed)\n"
    md += "1. **Lambda:** `BounceScannerLambda`\n"
    md += "2. **Trigger:** Manual (API `POST /campaigns/scan`) or Scheduled (CloudWatch Event - *To Be Implemented*)\n"
    md += "3. **Protocol:** IMAP (`imap.zoho.com:993`)\n"
    md += "4. **Process:**\n"
    md += "   - Auth via App Specific Password.\n"
    md += "   - Search INBOX for `mailer-daemon`.\n"
    md += "   - Parse `Final-Recipient`.\n"
    md += "   - Update `CampaignRecipients` table (`status='failed'`).\n"
    md += "   - Update `CampaignStats` table (`failedCount++`).\n"

    return md

if __name__ == "__main__":
    print("Gathering system info...")
    fe = get_frontend_endpoints()
    lam = get_lambdas()
    routes = get_api_gateway_routes()
    tbl = get_dynamodb_tables()
    
    print("Generating markdown...")
    content = generate_markdown(fe, lam, routes, tbl)
    
    with open("system_dump.json", "w") as f:
        json.dump(routes, f, indent=2, default=str)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Documentation generated at: {OUTPUT_FILE}")
