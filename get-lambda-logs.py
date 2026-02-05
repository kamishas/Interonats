import boto3
from datetime import datetime, timedelta

logs_client = boto3.client('logs', region_name='us-east-2')

# Get logs from last 30 minutes
end_time = int(datetime.now().timestamp() * 1000)
start_time = int((datetime.now() - timedelta(minutes=30)).timestamp() * 1000)

print("="*80)
print("SENDCAMPAIGNLAMBDA LOGS (Last 30 minutes)")
print("="*80)

try:
    response = logs_client.filter_log_events(
        logGroupName='/aws/lambda/SendCampaignLambda',
        startTime=start_time,
        endTime=end_time,
        limit=100
    )
    
    events = response.get('events', [])
    
    if events:
        for event in events:
            timestamp = datetime.fromtimestamp(event['timestamp']/1000)
            message = event['message'].strip()
            print(f"[{timestamp.strftime('%H:%M:%S')}] {message}")
    else:
        print("No logs found")
        
except Exception as e:
    print(f"Error: {e}")
