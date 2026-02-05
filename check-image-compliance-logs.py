import boto3
import json
from datetime import datetime, timedelta

logs_client = boto3.client('logs', region_name='us-east-2')

LOG_GROUP = '/aws/lambda/ImageComplianceLambda'

print("="*80)
print("CHECKING IMAGECOMPLIANCELAMBDA LOGS")
print("="*80)

try:
    # Get recent log streams
    streams = logs_client.describe_log_streams(
        logGroupName=LOG_GROUP,
        orderBy='LastEventTime',
        descending=True,
        limit=3
    )
    
    if not streams.get('logStreams'):
        print("No log streams found")
        exit(1)
    
    # Get logs from the most recent stream
    latest_stream = streams['logStreams'][0]['logStreamName']
    print(f"\nLatest log stream: {latest_stream}")
    print("="*80)
    
    # Get recent events
    events = logs_client.get_log_events(
        logGroupName=LOG_GROUP,
        logStreamName=latest_stream,
        limit=100,
        startFromHead=False
    )
    
    # Print relevant log lines
    print("\nRecent logs (last 50 lines):")
    print("-"*80)
    
    for event in events['events'][-50:]:
        message = event['message'].strip()
        # Filter for important messages
        if any(keyword in message.lower() for keyword in ['extracted', 'violation', 'text', 'claude', 'keyword', 'debug', 'h1b', 'opt', 'compliant']):
            timestamp = datetime.fromtimestamp(event['timestamp']/1000).strftime('%H:%M:%S')
            print(f"[{timestamp}] {message}")
    
    print("\n" + "="*80)
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
