import json

try:
    # Try reading as utf-16 first (PowerShell redirection default)
    try:
        with open('lambda_list.json', encoding='utf-16') as f:
            data = json.load(f)
    except:
        with open('lambda_list.json', encoding='utf-8') as f:
            data = json.load(f)

    for func in data['Functions']:
        name = func['FunctionName']
        if 'Bounce' in name or 'Email' in name or 'Scan' in name:
            print(f"FOUND: {name}")
            
except Exception as e:
    print(f"Error: {e}")
