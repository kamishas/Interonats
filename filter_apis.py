import json

try:
    with open('apis_list.json', encoding='utf-8') as f:
        # apis_list might be utf-8 or utf-16 depending on shell, usually run_command redirection is utf-16 on windows but sometimes utf-8. 
        # Actually previous run_command redirection showed utf-16 issue. Let's try utf-16 first, if fail try utf-8.
        pass
except:
    pass

# Helper to read robustly
def read_json():
    for enc in ['utf-16', 'utf-8', 'cp1252']:
        try:
            with open('apis_list.json', encoding=enc) as f:
                return json.load(f)
        except:
            continue
    return None

data = read_json()
if data:
    for item in data['items']:
        name = item.get('name', '')
        id = item.get('id', '')
        print(f"ID: {id}, Name: {name}")
else:
    print("Failed to read JSON")
