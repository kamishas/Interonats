import boto3
import json

lambda_client = boto3.client('lambda', region_name='us-east-2')
logs_client = boto3.client('logs', region_name='us-east-2')

functions = [
    'ListCampaignsLambda',
    'CreateCampaignLambda',
    'GetCampaignLambda',
    'ListContactsLambda',
    'AddContactLambda'
]

print("="*80)
print("DIAGNOSING LAMBDA FUNCTION ERRORS")
print("="*80)

for func_name in functions:
    print(f"\n{'='*80}")
    print(f"Checking: {func_name}")
    print("="*80)
    
    try:
        # Get function configuration
        response = lambda_client.get_function(FunctionName=func_name)
        config = response['Configuration']
        
        print(f"✅ Function exists")
        print(f"   Runtime: {config['Runtime']}")
        print(f"   Handler: {config['Handler']}")
        print(f"   Role: {config['Role']}")
        
        # Get recent logs
        log_group = f"/aws/lambda/{func_name}"
        
        try:
            log_streams = logs_client.describe_log_streams(
                logGroupName=log_group,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )
            
            if log_streams['logStreams']:
                stream_name = log_streams['logStreams'][0]['logStreamName']
                
                events = logs_client.get_log_events(
                    logGroupName=log_group,
                    logStreamName=stream_name,
                    limit=20
                )
                
                print(f"\n📋 Recent Logs:")
                for event in events['events'][-10:]:
                    msg = event['message'].strip()
                    if 'ERROR' in msg or 'Error' in msg or 'error' in msg:
                        print(f"   ❌ {msg}")
                    else:
                        print(f"   {msg}")
        except Exception as e:
            print(f"   ⚠️  No logs available yet")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

print(f"\n{'='*80}")
print("DIAGNOSIS COMPLETE")
print("="*80)
