import json

try:
    try:
        with open('api_details.json', encoding='utf-16') as f:
            data = json.load(f)
    except:
        with open('api_details.json', encoding='utf-8') as f:
            data = json.load(f)

    for item in data['items']:
        path = item.get('path')
        methods = item.get('resourceMethods', {})
        
        if '/campaigns' in path:
            print(f"\nResource: {path}")
            for method, details in methods.items():
                auth_type = details.get('authorizationType', 'UNKNOWN')
                print(f"  Method: {method}, Auth: {auth_type}")

except Exception as e:
    print(f"Error: {e}")
