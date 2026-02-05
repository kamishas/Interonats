import boto3
import json
from datetime import datetime, timedelta

logs_client = boto3.client('logs', region_name='us-east-2')

functions = ['ListContactsLambda', 'ListContactTagsLambda']

print("="*80)
print("CHECKING CLOUDWATCH LOGS FOR ERRORS")
print("="*80)

for func_name in functions:
    print(f"\n{'='*80}")
    print(f"Function: {func_name}")
    print("="*80)
    
    log_group = f"/aws/lambda/{func_name}"
    
    try:
        # Get recent log streams
        streams = logs_client.describe_log_streams(
            logGroupName=log_group,
            orderBy='LastEventTime',
            descending=True,
            limit=3
        )
        
        if not streams['logStreams']:
            print("  ⚠️  No log streams found")
            continue
        
        # Get events from most recent stream
        stream_name = streams['logStreams'][0]['logStreamName']
        print(f"  Log Stream: {stream_name}")
        
        events = logs_client.get_log_events(
            logGroupName=log_group,
            logStreamName=stream_name,
            limit=50,
            startFromHead=False
        )
        
        print(f"\n  Recent Logs:")
        error_found = False
        for event in events['events'][-20:]:
            msg = event['message'].strip()
            if any(word in msg.lower() for word in ['error', 'exception', 'traceback', 'failed']):
                print(f"    ❌ {msg}")
                error_found = True
            elif 'Event:' in msg or 'Found' in msg:
                print(f"    ℹ️  {msg[:100]}")
        
        if not error_found:
            print("    ✅ No errors in recent logs")
            
    except Exception as e:
        print(f"  ❌ Error reading logs: {str(e)}")

print(f"\n{'='*80}")
