import boto3
import time

print("LOGS FOR SendCampaignLambda (Last 15 mins)")
logs = boto3.client('logs', region_name='us-east-2')
log_group = '/aws/lambda/SendCampaignLambda'

try:
    streams = logs.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=5
    )
    
    for stream in streams['logStreams']:
        stream_name = stream['logStreamName']
        print(f"\n--- Stream: {stream_name} ---")
        
        events = logs.get_log_events(
            logGroupName=log_group,
            logStreamName=stream_name,
            limit=50,
            startFromHead=False
        )
        
        for e in events['events']:
            print(f"{e['message'].strip()}")
            
except Exception as e:
    print(f"Error: {str(e)}")
