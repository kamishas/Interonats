import boto3
import json
from datetime import datetime, timedelta

# Get CloudWatch logs
logs_client = boto3.client('logs', region_name='us-east-2')

# Get the most recent log stream
log_group = '/aws/lambda/ManageContactsLambda'

try:
    # Get recent log streams
    response = logs_client.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=1
    )
    
    if not response['logStreams']:
        print("No log streams found")
        exit(1)
    
    log_stream_name = response['logStreams'][0]['logStreamName']
    print(f"Reading from log stream: {log_stream_name}\n")
    
    # Get recent log events (last 5 minutes)
    start_time = int((datetime.utcnow() - timedelta(minutes=5)).timestamp() * 1000)
    
    events_response = logs_client.get_log_events(
        logGroupName=log_group,
        logStreamName=log_stream_name,
        startTime=start_time,
        limit=50
    )
    
    print("=" * 80)
    print("RECENT LAMBDA LOGS:")
    print("=" * 80)
    
    for event in events_response['events'][-20:]:  # Last 20 events
        timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
        message = event['message'].strip()
        print(f"[{timestamp}] {message}")
        
except Exception as e:
    print(f"Error: {str(e)}")
