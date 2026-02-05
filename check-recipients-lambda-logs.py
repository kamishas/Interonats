import boto3
from datetime import datetime

logs_client = boto3.client('logs', region_name='us-east-2')

LOG_GROUP = '/aws/lambda/ManageRecipientsLambda'

print("="*80)
print("CHECKING MANAGERECIPIENTSLAMBDA LOGS FOR ERRORS")
print("="*80)

try:
    # Get recent log streams
    streams = logs_client.describe_log_streams(
        logGroupName=LOG_GROUP,
        orderBy='LastEventTime',
        descending=True,
        limit=2
    )
    
    if not streams.get('logStreams'):
        print("No log streams found - Lambda hasn't been invoked yet")
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
    
    # Print ALL recent logs
    print("\nRecent logs (last 30 lines):")
    print("-"*80)
    
    for event in events['events'][-30:]:
        message = event['message'].strip()
        timestamp = datetime.fromtimestamp(event['timestamp']/1000).strftime('%H:%M:%S')
        print(f"[{timestamp}] {message}")
    
    print("\n" + "="*80)
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
