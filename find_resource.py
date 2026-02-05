import json
import sys

filename = 'campaign_api_resources.json'
if len(sys.argv) > 1:
    filename = sys.argv[1]

print(f"Reading {filename}...")
try:
    with open(filename, encoding='utf-16') as f:
        data = json.load(f)
        
    print(f"Total items: {len(data['items'])}")
    found_campaigns = False
    for item in data['items']:
        path = item.get('path')
        if path == '/campaigns':
            print(f"FOUND: {path} (ID: {item['id']})")
            print(f"Methods: {list(item.get('resourceMethods', {}).keys())}")
            found_campaigns = True
    
    if not found_campaigns:
        print("Path /campaigns NOT FOUND")
        # List first few to see what IS there
        print("Available paths (first 10):")
        for i, item in enumerate(data['items'][:10]):
             print(f"{item.get('path')}")

except Exception as e:
    print(f"Error: {e}")
