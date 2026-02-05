import requests

print("="*80)
print("TESTING BOTH API GATEWAYS")
print("="*80)

apis_to_test = [
    {
        'name': 'API 5cs5faz106 (with /prod)',
        'base': 'https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod'
    },
    {
        'name': 'API 5tdsq6s7h3 (no stage)',
        'base': 'https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com'
    }
]

for api in apis_to_test:
    print(f"\n{'='*80}")
    print(f"Testing: {api['name']}")
    print(f"Base: {api['base']}")
    print("="*80)
    
    endpoints = ['/contacts', '/campaigns']
    
    for endpoint in endpoints:
        try:
            url = f"{api['base']}{endpoint}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"  ✅ {endpoint}: 200 OK")
            else:
                print(f"  ❌ {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"  ❌ {endpoint}: ERROR - {str(e)}")

print(f"\n{'='*80}")
print("CONCLUSION")
print("="*80)
print("\nWe need to use the API Gateway that returns 200 OK!")
