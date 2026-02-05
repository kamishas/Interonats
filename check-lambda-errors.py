import boto3
from datetime import datetime, timedelta

logs_client = boto3.client('logs', region_name='us-east-2')

# Check both Lambda functions
LAMBDAS = [
    ('ManageRecipientsLambda', '/aws/lambda/ManageRecipientsLambda'),
    ('ConfigureCampaignLambda', '/aws/lambda/ConfigureCampaignLambda')
]

print("="*80)
print("CHECKING LAMBDA CLOUDWATCH LOGS FOR 500 ERRORS")
print("="*80)

for lambda_name, log_group in LAMBDAS:
    print(f"\n{'='*80}")
    print(f"LAMBDA: {lambda_name}")
    print("="*80)
    
    try:
        # Get recent log streams
        streams = logs_client.describe_log_streams(
            logGroupName=log_group,
            orderBy='LastEventTime',
            descending=True,
            limit=2
        )
        
        if not streams.get('logStreams'):
            print(f"⚠️  No log streams found for {lambda_name}")
            continue
        
        # Get logs from the most recent stream
        latest_stream = streams['logStreams'][0]['logStreamName']
        print(f"\nLatest log stream: {latest_stream}")
        
        # Get recent events
        events = logs_client.get_log_events(
            logGroupName=log_group,
            logStreamName=latest_stream,
            limit=100,
            startFromHead=False
        )
        
        # Print error-related logs
        print("\nRecent error logs:")
        print("-"*80)
        
        error_found = False
        for event in events['events'][-50:]:
            message = event['message'].strip()
            # Filter for errors
            if any(keyword in message.lower() for keyword in ['error', 'exception', 'traceback', 'failed', 'invalid']):
                timestamp = datetime.fromtimestamp(event['timestamp']/1000).strftime('%H:%M:%S')
                print(f"[{timestamp}] {message}")
                error_found = True
        
        if not error_found:
            print("No errors found in recent logs")
        
    except Exception as e:
        print(f"❌ Error checking {lambda_name}: {str(e)}")

print(f"\n{'='*80}")
