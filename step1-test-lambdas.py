import boto3
import json

lambda_client = boto3.client('lambda', region_name='us-east-2')

print("="*80)
print("STEP 1: TESTING ALL LAMBDA FUNCTIONS DIRECTLY")
print("="*80)

functions_to_test = [
    'ListContactsLambda',
    'ListContactTagsLambda',
    'AddContactLambda',
    'ListCampaignsLambda',
    'CreateCampaignLambda',
    'GetCampaignLambda',
    'ConfigureCampaignLambda',
    'ManageRecipientsLambda',
    'SendCampaignLambda'
]

results = {}

for func_name in functions_to_test:
    print(f"\n{'='*80}")
    print(f"Testing: {func_name}")
    print("="*80)
    
    try:
        # Invoke Lambda directly
        response = lambda_client.invoke(
            FunctionName=func_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'requestContext': {'http': {'method': 'GET'}},
                'headers': {}
            })
        )
        
        payload = json.loads(response['Payload'].read())
        status_code = payload.get('statusCode', 'NO STATUS')
        
        if status_code == 200:
            print(f"✅ Lambda returns: 200 OK")
            results[func_name] = 'PASS'
        else:
            print(f"❌ Lambda returns: {status_code}")
            print(f"   Response: {payload}")
            results[func_name] = 'FAIL'
            
    except Exception as e:
        print(f"❌ Error invoking Lambda: {str(e)}")
        results[func_name] = 'ERROR'

print(f"\n{'='*80}")
print("LAMBDA FUNCTION TEST SUMMARY")
print("="*80)

passed = sum(1 for v in results.values() if v == 'PASS')
failed = sum(1 for v in results.values() if v in ['FAIL', 'ERROR'])

print(f"\n✅ Passed: {passed}/{len(functions_to_test)}")
print(f"❌ Failed: {failed}/{len(functions_to_test)}")

print("\nDetailed Results:")
for func, result in results.items():
    symbol = "✅" if result == "PASS" else "❌"
    print(f"  {symbol} {func}: {result}")

print(f"\n{'='*80}")
