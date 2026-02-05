import boto3
import json
from decimal import Decimal

# Helper to handle Decimal serialization
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def analyze_table(table_name, file_handle):
    file_handle.write(f"\n--- Analyzing Table: {table_name} ---\n")
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table(table_name)
    
    try:
        # Get one item
        scan_kwargs = {'Limit': 1}
        if table_name == 'Contacts':
             scan_kwargs['FilterExpression'] = boto3.dynamodb.conditions.Attr("email").exists()
             scan_kwargs['Limit'] = 10 # Scan more to find one
        
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        if not items:
            file_handle.write("Table is empty.\n")
            return

        item = items[0]
        # Print keys and inferred types
        for key, value in item.items():
            value_type = type(value).__name__
            if isinstance(value, Decimal):
                value_type = "Number"
            elif isinstance(value, list):
                value_type = "List"
            elif isinstance(value, dict):
                value_type = "Map"
            elif isinstance(value, str):
                value_type = "String"
            elif isinstance(value, bool):
                value_type = "Boolean"
            
            # file_handle.write(f"{key}: {value_type}\n") # Deduplicated by json dump
            
        file_handle.write("\nSample Item JSON:\n")
        file_handle.write(json.dumps(item, default=decimal_default, indent=2))
        file_handle.write("\n")
        
    except Exception as e:
        file_handle.write(f"Error analyzing table {table_name}: {e}\n")

if __name__ == "__main__":
    tables = ['Contacts', 'Campaigns', 'ContactTags', 'CampaignRecipients', 'GlobalContacts']
    with open('schema_analysis.txt', 'w') as f:
        for t in tables:
            analyze_table(t, f)
    print("Analysis complete. Check schema_analysis.txt")
