import boto3
import time

log_group = '/aws/lambda/ConfigureCampaignLambda'
client = boto3.client('logs', region_name='us-east-2')

print(f"Fetching logs for {log_group}...")

try:
    # 1. Get latest stream
    streams = client.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=1
    )
    
    if not streams['logStreams']:
        print("No log streams found.")
        exit()
        
    stream_name = streams['logStreams'][0]['logStreamName']
    print(f"Stream: {stream_name}")
    
    # 2. Get events
    events = client.get_log_events(
        logGroupName=log_group,
        logStreamName=stream_name,
        limit=20,
        startFromHead=False
    )
    
    for e in events['events']:
        print(f"{e['timestamp']} - {e['message'].strip()}")

except Exception as e:
    print(f"Error: {str(e)}")
