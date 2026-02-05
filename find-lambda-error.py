import boto3
import json
from datetime import datetime, timedelta

# Get CloudWatch logs for the exact error
logs_client = boto3.client('logs', region_name='us-east-2')
log_group = '/aws/lambda/ManageContactsLambda'

try:
    # Get the most recent log stream
    streams_response = logs_client.describe_log_streams(
        logGroupName=log_group,
        orderBy='LastEventTime',
        descending=True,
        limit=3
    )
    
    print("=" * 80)
    print("CHECKING RECENT LAMBDA EXECUTIONS FOR ERRORS")
    print("=" * 80)
    
    for stream in streams_response['logStreams']:
        stream_name = stream['logStreamName']
        print(f"\n📋 Log Stream: {stream_name}")
        print("-" * 80)
        
        # Get events from this stream
        events_response = logs_client.get_log_events(
            logGroupName=log_group,
            logStreamName=stream_name,
            limit=100,
            startFromHead=False
        )
        
        # Look for errors
        for event in events_response['events']:
            message = event['message'].strip()
            
            # Print error messages
            if any(keyword in message.lower() for keyword in ['error', 'exception', 'traceback', 'failed']):
                timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
                print(f"[{timestamp}] ❌ {message}")
            
            # Print the event data to see request/response
            if '"httpMethod"' in message or '"statusCode"' in message:
                timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
                print(f"[{timestamp}] 📨 {message}")
        
        print()

except Exception as e:
    print(f"Error reading logs: {str(e)}")
    import traceback
    traceback.print_exc()
