import boto3
import json
import time
import uuid
from datetime import datetime

# Clients
ddb = boto3.resource('dynamodb', region_name='us-east-2')
lambda_client = boto3.client('lambda', region_name='us-east-2')
campaigns_table = ddb.Table('Campaigns')
recipients_table = ddb.Table('CampaignRecipients')

CAMPAIGN_ID = f"TEST_MANUAL_{int(time.time())}"
RECIPIENT_EMAIL = f"bounce_test_{int(time.time())}@invalid-domain-simulator.com"

def log(msg):
    print(msg)
    with open("simulation_result.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def step_1_create_campaign():
    log(f"\n[1] Creating Campaign: {CAMPAIGN_ID}")
    campaigns_table.put_item(Item={
        'campaignId': CAMPAIGN_ID,
        'name': 'Bounce Test Simulation',
        'status': 'draft',
        'subject': 'Bounce Test Subject',
        'body': 'This is a test email expecting a bounce.',
        'createdAt': datetime.now().isoformat(),
        'recipients': [],
        'sentCount': 0,
        'failedCount': 0,
        'totalRecipients': 1
    })

def step_2_add_recipient():
    log(f"[2] Adding Recipient: {RECIPIENT_EMAIL}")
    recipients_table.put_item(Item={
        'campaignId': CAMPAIGN_ID,
        'recipientId': str(uuid.uuid4()),
        'email': RECIPIENT_EMAIL,
        'firstName': 'Jessica',
        'lastName': 'Garcia',
        'status': 'pending'
    })

def step_3_dispatch_campaign():
    log("[3] Dispatching Campaign (SendCampaignLambda)...")
    payload = {
        "pathParameters": {"campaignId": CAMPAIGN_ID},
        "httpMethod": "POST"
    }
    resp = lambda_client.invoke(
        FunctionName='SendCampaignLambda',
        Payload=json.dumps(payload)
    )
    res_payload = json.loads(resp['Payload'].read())
    log(f"    Result: {res_payload.get('statusCode')}")

def step_4_verify_sent():
    log("[4] Verifying status is 'sent' (Dispatched)...")
    # Wait a sec for DB consistency
    time.sleep(2)
    resp = recipients_table.query(
        KeyConditionExpression='campaignId = :cid',
        ExpressionAttributeValues={':cid': CAMPAIGN_ID}
    )
    items = resp.get('Items', [])
    if items and items[0]['status'] == 'sent':
        log("    ✅ Status is SENT (Dispatched).")
    else:
        log(f"    ❌ Status is {items[0]['status'] if items else 'None'}")

def step_5_check_for_bounce():
    log("[5] Waiting 30 seconds for email to bounce...")
    time.sleep(30)
    
    log("[6] Running BounceScannerLambda...")
    resp = lambda_client.invoke(
        FunctionName='BounceScannerLambda',
        Payload=json.dumps({"httpMethod": "POST"})
    )
    payload_stream = resp['Payload'].read()
    log(f"    Raw Payload: {str(payload_stream[:500])}") 
    res_payload = json.loads(payload_stream)
    
    encoded_body = res_payload.get('body', '{}')
    if isinstance(encoded_body, str):
         body = json.loads(encoded_body)
    else:
         body = encoded_body
         
    log(f"    Scanner Found: {body.get('count')} bounces")

def step_6_verify_failed():
    log("[7] Verifying status changed to 'failed'...")
    resp = recipients_table.query(
        KeyConditionExpression='campaignId = :cid',
        ExpressionAttributeValues={':cid': CAMPAIGN_ID}
    )
    items = resp.get('Items', [])
    if items:
        r = items[0]
        log(f"    Final Status: {r['status']}")
        if r['status'] == 'failed':
            log(f"    ✅ SUCCESS! Error: {r.get('errorMessage')}")
        else:
            log("    ❌ Failed to detect bounce.")
    else:
        log("    ❌ Recipient not found.")

if __name__ == "__main__":
    # Clear file
    with open("simulation_result.txt", "w") as f: f.write("")
    try:
        step_1_create_campaign()
        step_2_add_recipient()
        step_3_dispatch_campaign()
        step_4_verify_sent()
        step_5_check_for_bounce()
        step_6_verify_failed()
    except Exception as e:
        log(f"CRASH: {e}")
