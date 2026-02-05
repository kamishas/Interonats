import json
import os
import boto3
import time
import imaplib
import email
import re
from datetime import datetime
from email.header import decode_header
from boto3.dynamodb.conditions import Attr

# AWS Clients
dynamodb = boto3.resource('dynamodb')
recipients_table = dynamodb.Table('CampaignRecipients')
campaigns_table = dynamodb.Table('Campaigns')
stats_table = dynamodb.Table('CampaignStats')

# Zoho Config
REFRESH_TOKEN = os.environ.get('ZOHO_REFRESH_TOKEN')
CLIENT_ID = os.environ.get('ZOHO_CLIENT_ID')
CLIENT_SECRET = os.environ.get('ZOHO_CLIENT_SECRET')

def parse_header(msg, header_name):
    header_val = msg.get(header_name)
    if not header_val:
        return ""
    decoded_list = decode_header(header_val)
    header_str = ""
    for token, encoding in decoded_list:
        if isinstance(token, bytes):
            if encoding:
                header_str += token.decode(encoding)
            else:
                header_str += token.decode('utf-8', errors='ignore')
        else:
            header_str += str(token)
    return header_str

def parse_failed_email(msg_content):
    # Strategy 1: Check "X-Failed-Recipients" header
    if "X-Failed-Recipients" in msg_content:
         match = re.search(r"X-Failed-Recipients:\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", str(msg_content))
         if match:
             return match.group(1)

    # Strategy 2: Look for "Final-Recipient" in body (DSN)
    # Final-Recipient: rfc822; jgarcia@nexustech.com
    match = re.search(r"Final-Recipient:\s*rfc822;\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", str(msg_content), re.IGNORECASE)
    if match:
        return match.group(1)
        
    # Strategy 3: Zoho specific "The following addresses had fatal errors"
    # The following addresses had fatal errors -----
    # [d.young@fusion.io]
    match = re.search(r"The following addresses had fatal errors[- ]*[\r\n]+\[?([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\]?", str(msg_content), re.MULTILINE | re.IGNORECASE)
    if match:
        return match.group(1)

    return None

def parse_failure_reason(msg_content):
    # Look for "Diagnostic-Code" (Flexible regex)
    match = re.search(r"Diagnostic-Code:\s*(?:smtp;)?\s*(.*)", str(msg_content), re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return "Unknown Bounce Reason"

def update_recipient_status(email, reason, timestamp):
    print(f"Updating status for {email}...")
    
    response = recipients_table.scan(
        FilterExpression=Attr('email').eq(email)
    )
    
    items = response.get('Items', [])
    updated_campaign_ids = set()
    
    for item in items:
        # Update logic: Only update if not already failed to avoid overwrites (or overwrite if we want latest error)
        # We will overwrite to ensure latest status
        c_id = item['campaignId']
        r_id = item.get('recipientId')
        
        if not r_id:
             continue
        
        try:
            recipients_table.update_item(
                Key={'campaignId': c_id, 'recipientId': r_id},
                UpdateExpression="set #s = :s, #e = :e, #f = :f",
                ExpressionAttributeNames={
                    '#s': 'status',
                    '#e': 'errorMessage',
                    '#f': 'failedAt'
                },
                ExpressionAttributeValues={
                    ':s': 'failed',
                    ':e': reason,
                    ':f': timestamp
                }
            )
            updated_campaign_ids.add(c_id)
            print(f"Updated {email} in campaign {c_id}")
        except Exception as e:
            print(f"Error updating DB: {e}")
            
    return updated_campaign_ids

def update_campaign_stats(campaign_id, stat_type='failed'):
    try:
        # Update the main Campaigns table directly
        expression = "SET #c = if_not_exists(#c, :start) + :inc"
        attr_name = 'failedCount' if stat_type == 'failed' else 'deliveredCount' if stat_type == 'delivered' else 'sentCount'
        
        campaigns_table.update_item(
            Key={'campaignId': campaign_id},
            UpdateExpression=expression,
            ExpressionAttributeNames={'#c': attr_name},
            ExpressionAttributeValues={':inc': 1, ':start': 0}
        )
        print(f"Incremented {stat_type} count for campaign {campaign_id}")
    except Exception as e:
        print(f"Error updating stats for {campaign_id}: {e}")

def promote_delivered_emails():
    """
    Scans for emails with 'sent' status that were updated > 1 hour ago.
    Updates them to 'delivered'.
    """
    print("Checking for delivered emails...")
    promoted_count = 0
    now = time.time()
    one_hour_ago = now - 3600
    
    # We ideally need a GSI on status, but scan is okay for small scale
    response = recipients_table.scan(
        FilterExpression=Attr('status').eq('sent')
    )
    items = response.get('Items', [])
    print(f"Found {len(items)} 'sent' items to check.")
    
    for item in items:
        try:
            # WORKAROUND: We will check 'addedAt' (created time) as a proxy if sentAt is invalid.
            timestamp_str = item.get('addedAt')
            if not timestamp_str:
                continue
                
            try:
                ts = float(timestamp_str)
            except ValueError:
                continue
                
            if ts < one_hour_ago:
                # Promote!
                c_id = item['campaignId']
                r_id = item['recipientId']
                
                print(f"Promoting {item.get('email')} to delivered (sent > 1hr ago)")
                recipients_table.update_item(
                    Key={'campaignId': c_id, 'recipientId': r_id},
                    UpdateExpression="set #s = :s",
                    ExpressionAttributeNames={'#s': 'status'},
                    ExpressionAttributeValues={':s': 'delivered'}
                )
                
                # Update Campaign Aggregate Stats
                update_campaign_stats(c_id, 'delivered')
                
                promoted_count += 1
                
        except Exception as e:
            print(f"Error promoting item: {e}")
            
    print(f"Promoted {promoted_count} emails to 'delivered'.")
    return promoted_count

def lambda_handler(event, context):
    print("Bounce Scanner (IMAP + Delivery Check) Started")
    
    # 0. Handle CORS
    if event.get('httpMethod') == 'OPTIONS':
         return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
        
    # 1. Promote Successes (Auto-verify)
    promoted = promote_delivered_emails()

    # 2. Check Failures (IMAP)
    app_password = os.environ.get('ZOHO_APP_PASSWORD')
    email_user = os.environ.get('ZOHO_EMAIL', "shasank.k@interonit.com")
    
    if not app_password:
         return {'statusCode': 500, 'body': 'Missing ZOHO_APP_PASSWORD'}

    processed_count = 0
    bounced_details = []
    failed_campaigns = set()

    try:
        print(f"Connecting to IMAP as {email_user}...")
        mail = imaplib.IMAP4_SSL("imap.zoho.com")
        mail.login(email_user, app_password)
        mail.select("INBOX")
        
        # Search for bounces
        status, messages = mail.search(None, '(FROM "mailer-daemon")')
        
        if status == "OK":
            msg_ids = messages[0].split()
            recent_ids = msg_ids[-20:] # Check last 20
            
            for num in recent_ids:
                try:
                    res, data = mail.fetch(num, '(RFC822)')
                    raw_email = data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    subject = parse_header(msg, "Subject")
                    print(f"Processing: {subject}")
                    
                    if "Delivery Status Notification" in subject or "Undelivered Mail" in subject or "Returned" in subject:
                        body_content = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                if part.get_content_type() in ["text/plain", "message/delivery-status"]:
                                    payload = part.get_payload(decode=True)
                                    if payload:
                                        body_content += str(payload)
                        else:
                            body_content = str(msg.get_payload(decode=True))
                        
                        full_content = body_content + str(msg)
                        failed_email = parse_failed_email(full_content)
                        
                        if failed_email:
                            reason = parse_failure_reason(full_content)
                            timestamp = str(int(time.time() * 1000))
                            
                            print(f" -> Found Bounce: {failed_email} Reason: {reason}")
                            
                            cids = update_recipient_status(failed_email, reason, timestamp)
                            if cids:
                                failed_campaigns.update(cids)
                                bounced_details.append({"email": failed_email, "reason": reason})
                                processed_count += 1
                                
                except Exception as inner_e:
                    print(f"Error processing message {num}: {inner_e}")
                    continue

        mail.close()
        mail.logout()
        
        # Update Stats
        for cid in failed_campaigns:
            update_campaign_stats(cid)

    except Exception as e:
        print(f"IMAP Error: {e}")
        # Dont fail hard, return partial success if promotion worked
        
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps({
            "promoted_delivered": promoted,
            "processed_bounces": processed_count,
            "bounces": bounced_details
        })
    }
