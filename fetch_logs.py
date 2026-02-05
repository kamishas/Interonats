import boto3
import time

client = boto3.client('logs', region_name='us-east-2')
LOG_GROUP = '/aws/lambda/ManageContactsLambda'

def get_latest_log_stream():
    resp = client.describe_log_streams(
        logGroupName=LOG_GROUP,
        orderBy='LastEventTime',
        descending=True,
        limit=1
    )
    if not resp.get('logStreams'):
        return None
    return resp['logStreams'][0]['logStreamName']

def get_log_events(stream_name):
    print(f"Fetching last 20 events from: {stream_name}")
    resp = client.get_log_events(
        logGroupName=LOG_GROUP,
        logStreamName=stream_name,
        limit=50,
        startFromHead=False
    )
    events = resp['events']
    for event in events[-20:]:
        print(f"[{event['timestamp']}] {event['message'].strip()}")

if __name__ == '__main__':
    stream = get_latest_log_stream()
    if stream:
        get_log_events(stream)
    else:
        print("No log streams found.")
