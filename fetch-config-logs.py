import boto3
import time

logs_client = boto3.client('logs', region_name='us-east-2')

GROUP_NAME = '/aws/lambda/ConfigureCampaignLambda'

print(f"Fetching logs for {GROUP_NAME}...")

try:
    streams = logs_client.describe_log_streams(
        logGroupName=GROUP_NAME,
        orderBy='LastEventTime',
        descending=True,
        limit=1
    )
    
    if not streams['logStreams']:
        print("No log streams found.")
        exit()
        
    stream_name = streams['logStreams'][0]['logStreamName']
    print(f"Reading stream: {stream_name}")
    
    resp = logs_client.get_log_events(
        logGroupName=GROUP_NAME,
        logStreamName=stream_name,
        limit=50,
        startFromHead=False
    )
    
    for event in resp['events']:
        print(event['message'].strip())
        
except Exception as e:
    print(f"Error: {e}")
