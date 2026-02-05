import json
import os
import boto3
import urllib3
import urllib.parse
import base64
import html
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from boto3.dynamodb.conditions import Key
from datetime import datetime

# Environment
CAMPAIGNS_TABLE_NAME = os.getenv("CAMPAIGNS_TABLE", "Campaigns")
RECIPIENTS_TABLE_NAME = os.getenv("RECIPIENTS_TABLE", "CampaignRecipients")
BUCKET_NAME = "interon-email-images"

# Zoho Configuration
ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"
ZOHO_BASE_URL = os.getenv("ZOHO_BASE_URL", "https://mail.zoho.com")
ZOHO_ACCOUNT_ID = os.getenv("ZOHO_ACCOUNT_ID")
SOURCE_EMAIL = os.getenv("SOURCE_EMAIL")

# Zoho OAuth Credentials
ZOHO_CLIENT_ID = os.getenv("ZOHO_CLIENT_ID")
ZOHO_CLIENT_SECRET = os.getenv("ZOHO_CLIENT_SECRET")
ZOHO_REFRESH_TOKEN = os.getenv("ZOHO_REFRESH_TOKEN")

# AWS Clients
ddb = boto3.resource("dynamodb")
s3 = boto3.client("s3", region_name="us-east-2")
campaigns_table = ddb.Table(CAMPAIGNS_TABLE_NAME)
recipients_table = ddb.Table(RECIPIENTS_TABLE_NAME)

http = urllib3.PoolManager()


config_table = ddb.Table('SystemConfig')

def get_sender_config():
    """Fetch credentials with DynamoDB priority (Session -> Global), Env fallback"""
    try:
        # 1. Try to get active session (from Connect Zoho button)
        session_resp = config_table.get_item(Key={'configId': 'current_session'})
        session = session_resp.get('Item')
        
        if session:
             # Check expiry
            expires_at = session.get('expiresAt')
            if expires_at and datetime.fromisoformat(expires_at) > datetime.utcnow():
                print(f"Using active session (Expires: {expires_at})")
                return {
                    'authMode': 'oauth',
                    'accessToken': session.get('accessToken'), # Direct access token
                    'refresh': session.get('refreshToken'),
                    'id': os.getenv("ZOHO_CLIENT_ID"), 
                    'secret': os.getenv("ZOHO_CLIENT_SECRET"),
                    'email': session.get('email') or os.getenv("SOURCE_EMAIL"), # Use session email
                    'accountId': session.get('accountId') or os.getenv("ZOHO_ACCOUNT_ID"), # Use session accountId
                    'is_session': True
                }

        # 2. Fallback to global config
        resp = config_table.get_item(Key={'configId': 'zoho_global'})
        item = resp.get('Item')
        if item:
            print(f"Using credentials from SystemConfig (Mode: {item.get('authMode', 'oauth')})")
            return {
                'authMode': item.get('authMode', 'oauth'),
                'id': item.get('clientId'),
                'secret': item.get('clientSecret'),
                'refresh': item.get('refreshToken'),
                'email': item.get('fromEmail'),
                'appPassword': item.get('appPassword'),
                 'is_session': False
            }
    except Exception as e:
        print(f"DB Config Error: {e}")

    return {
        'authMode': 'oauth', # Default fallback
        'id': os.getenv("ZOHO_CLIENT_ID", "1000.RTTVTRWBP9AZYN7GOWN74LGVXEUNHV"),
        'secret': os.getenv("ZOHO_CLIENT_SECRET", "48b8ecdd40b6ab9f0f9f76ed832f442dae9c8a7620"),
        'refresh': os.getenv("ZOHO_REFRESH_TOKEN"),
        'email': os.getenv("SOURCE_EMAIL"),
        'appPassword': None,
        'is_session': False
    }

def get_fresh_access_token():
    """Exchange refresh token for access token"""
    config = get_sender_config()
    
    # Update global SOURCE_EMAIL for use in send function
    global SOURCE_EMAIL
    if config['email']:
        SOURCE_EMAIL = config['email']

    if not (config['id'] and config['secret'] and config['refresh']):
        raise RuntimeError("Missing Zoho credentials")

    params = {
        "refresh_token": config['refresh'],
        "client_id": config['id'],
        "client_secret": config['secret'],
        "grant_type": "refresh_token"
    }
    
    encoded_params = urllib.parse.urlencode(params)
    url = f"{ZOHO_AUTH_URL}?{encoded_params}"

    print("Requesting new Access Token from Zoho...")
    resp = http.request("POST", url)
    
    if resp.status != 200:
        raise RuntimeError(f"Failed to refresh token: {resp.data.decode('utf-8')}")
        
    data = json.loads(resp.data.decode("utf-8"))
    
    if "access_token" not in data:
        raise RuntimeError(f"Zoho did not return an access token: {data}")
        
    return data["access_token"]

def api_response(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body),
    }

def get_campaign_images(campaign_id):
    """Fetch approved images details for campaign from S3 (for presigning)"""
    try:
        prefix = f"approved/{campaign_id}/"
        response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        
        images = []
        if 'Contents' in response:
            for obj in response['Contents']:
                key = obj['Key']
                # Generate Presigned URL (Valid for 7 days)
                presigned_url = s3.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': BUCKET_NAME, 'Key': key},
                    ExpiresIn=604800 # 7 days
                )
                
                images.append({
                    'filename': os.path.basename(key),
                    'url': presigned_url,
                    'key': key
                })
        
        print(f"Found {len(images)} images for campaign {campaign_id}")
        return images
    except Exception as e:
        print(f"Error fetching images: {e}")
        return []

def send_email_via_zoho(access_token, to_email, subject, content, images=None, sender_email=None, account_id=None):
    """Send email via Zoho Mail API with inline image links"""
    # Use provided account_id or fall back to Env (legacy)
    aid = account_id or ZOHO_ACCOUNT_ID
    url = f"{ZOHO_BASE_URL}/api/accounts/{aid}/messages"
    
    # Use provided sender or Global default
    from_addr = sender_email or SOURCE_EMAIL
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    
    # Append Images to Body
    final_content = content
    if images:
        print(f"Embedding {len(images)} images in body")
        for img in images:
            # Add some spacing and the image tag (HTML Escaped URL)
            safe_url = html.escape(img["url"])
            final_content += f'<br><br><img src="{safe_url}" alt="{img["filename"]}" style="max-width:100%; height:auto;"><br>'
    
    payload = {
        "fromAddress": from_addr,
        "toAddress": to_email,
        "subject": subject,
        "content": final_content,
        "mailFormat": "html"
    }
    
    # No "attachments" field needed
    
    resp = http.request("POST", url, headers=headers, body=json.dumps(payload).encode("utf-8"))
    
    if resp.status not in [200, 201]:
        raise RuntimeError(f"Zoho send error: {resp.data.decode('utf-8')}")
        
    data = json.loads(resp.data.decode("utf-8"))
    
    zoho_data = data.get("data")
    msg_id = ""
    if isinstance(zoho_data, list) and zoho_data:
        msg_id = zoho_data[0].get("messageId", "")
    elif isinstance(zoho_data, dict):
        msg_id = zoho_data.get("messageId", "")
    else:
        msg_id = data.get("messageId", "")
        
    if not msg_id:
        raise RuntimeError(f"Zoho returned success status but no Message ID. Response: {json.dumps(data)}")
        
    return msg_id

def send_email_via_smtp(config, to_email, subject, content, images=None):
    """Send email via Zoho SMTP using App Password"""
    smtp_server = "smtp.zoho.com"
    smtp_port = 587
    sender_email = config['email']
    password = config['appPassword']
    
    if not (sender_email and password):
        raise RuntimeError("Missing Email or App Password for SMTP sending")

    # Create Message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email
    
    # Append Images to Body (Remote Links)
    final_content = content
    if images:
        print(f"Embedding {len(images)} images in body")
        for img in images:
            safe_url = html.escape(img["url"])
            final_content += f'<br><br><img src="{safe_url}" alt="{img["filename"]}" style="max-width:100%; height:auto;"><br>'
            
    # Attach HTML Body
    msg.attach(MIMEText(final_content, "html"))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return "smtp-sent-" + datetime.now().strftime("%Y%m%d%H%M%S")
    except Exception as e:
        raise RuntimeError(f"SMTP Error: {str(e)}")

def render_text(text, first_name, last_name, company):
    """Personalize email content"""
    if not text:
        return ""
    
    rendered = text
    rendered = rendered.replace("{{firstName}}", first_name).replace("{firstName}", first_name)
    rendered = rendered.replace("{{lastName}}", last_name).replace("{lastName}", last_name)
    rendered = rendered.replace("{{company}}", company).replace("{company}", company)
    
    return rendered

def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get("httpMethod") == "OPTIONS":
            return api_response(200, {"message": "CORS preflight"})
        
        # 1. Get campaign ID (Moved up for Auth usage)
        path_params = event.get("pathParameters") or {}
        campaign_id = path_params.get("campaignId")
        
        if not campaign_id:
            return api_response(400, {"error": "missing_campaignId"})

        # 2. Fetch Configuration & Credentials
        config = get_sender_config()
        auth_mode = config.get('authMode', 'oauth')
        access_token = None
        
        # 3. Prepare Authentication (if OAuth)
        if auth_mode == 'oauth':
            # Check if we have a valid session token directly
            if config.get('is_session') and config.get('accessToken'):
                 # Pre-check valid campaign to save token call
                 recip_resp = recipients_table.query(KeyConditionExpression=Key("campaignId").eq(campaign_id))
                 access_token = config['accessToken']
                 print("✅ Using active session token")
            else:
                 # Fallback to refresh flow
                 access_token = get_fresh_access_token()
                 print("✅ Token successfully refreshed from refresh_token")
        else:
             print("ℹ️ Using SMTP Mode (skipping token refresh)")

        # Load campaign
        camp_resp = campaigns_table.get_item(Key={"campaignId": campaign_id})
        campaign = camp_resp.get("Item")
        if not campaign:
            return api_response(404, {"error": "campaign_not_found"})


        subject = campaign.get("subject", "")
        body = campaign.get("body") or campaign.get("bodyTemplate", "")  # Check both field names
        
        if not subject or not body:
            return api_response(400, {"error": "Campaign missing subject or body"})

        # Get campaign images
        images = get_campaign_images(campaign_id)

        # Load recipients
        recip_resp = recipients_table.query(
            KeyConditionExpression=Key("campaignId").eq(campaign_id)
        )
        recipients = recip_resp.get("Items", [])
        
        if not recipients:
            return api_response(400, {"error": "No recipients found"})

        # Update campaign status to 'sending'
        campaigns_table.update_item(
            Key={"campaignId": campaign_id},
            UpdateExpression="SET #st = :s",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={":s": "sending"}
        )

        # Send emails
        sent_count = 0
        failed_count = 0

        for recipient in recipients:
            # Skip if already sent
            if recipient.get("status") == "sent":
                continue

            first_name = recipient.get("firstName", "").strip() or "Friend"
            last_name = recipient.get("lastName", "").strip()
            company = recipient.get("company", "").strip()
            email = recipient.get("email", "")

            # Personalize content
            final_subject = render_text(subject, first_name, last_name, company)
            final_body = render_text(body, first_name, last_name, company)
            
            # Convert newlines to HTML breaks
            final_body = final_body.replace("\n", "<br>")

            try:
                # Send email (Dispatch based on mode)
                msg_id = ""
                if auth_mode == 'oauth':
                    msg_id = send_email_via_zoho(
                        access_token, email, final_subject, final_body, images,
                        sender_email=config.get('email'),
                        account_id=config.get('accountId')
                    )
                else:
                    msg_id = send_email_via_smtp(config, email, final_subject, final_body, images)
                
                # Update recipient status
                recipients_table.update_item(
                    Key={"campaignId": campaign_id, "recipientId": recipient["recipientId"]},
                    UpdateExpression="SET #st = :s, zohoMessageId = :m, sentAt = :t",
                    ExpressionAttributeNames={"#st": "status"},
                    ExpressionAttributeValues={
                        ":s": "sent",
                        ":m": msg_id,
                        ":t": context.aws_request_id
                    }
                )
                sent_count += 1
                print(f"✅ Sent to {email}")
                
            except Exception as e:
                print(f"❌ Failed to send to {email}: {str(e)}")
                recipients_table.update_item(
                    Key={"campaignId": campaign_id, "recipientId": recipient["recipientId"]},
                    UpdateExpression="SET #st = :s, errorMessage = :e",
                    ExpressionAttributeNames={"#st": "status"},
                    ExpressionAttributeValues={":s": "failed", ":e": str(e)}
                )
                failed_count += 1

    
        # Update Campaign Status to 'completed' or 'sent'
        # AND Update Stats (Total, Sent, Failed)
        try:
            # Re-query recipients to get accurate counts
            all_recipients = []
            last_evaluated_key = None
            while True:
                scan_kwargs = {'TableName': recipients_table.name, 'KeyConditionExpression': Key('campaignId').eq(campaign_id)}
                if last_evaluated_key:
                    scan_kwargs['ExclusiveStartKey'] = last_evaluated_key
                
                # Using Query (since we have Partition Key)
                response = recipients_table.query(**scan_kwargs)
                all_recipients.extend(response.get('Items', []))
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
            
            total_count = len(all_recipients)
            sent_final = len([r for r in all_recipients if r.get('status') == 'sent'])
            failed_final = len([r for r in all_recipients if r.get('status') == 'failed'])
            
            print(f"Final Stats - Total: {total_count}, Sent: {sent_final}, Failed: {failed_final}")
            
            # Determine campaign status based on final counts
            # If all recipients are either 'sent' or 'failed', the campaign is 'completed'.
            # If there are still recipients not processed (e.g., status not 'sent' or 'failed'), it might be 'partial' or 'sending'.
            # For simplicity, if all are processed, and some failed, it's 'partial'. If all sent, it's 'sent'.
            if total_count == sent_final:
                campaign_status = 'sent'
            elif total_count == (sent_final + failed_final):
                campaign_status = 'completed' # All processed, some failed
            else:
                campaign_status = 'partial' # Some still pending or other statuses
            
            campaigns_table.update_item(
                Key={'campaignId': campaign_id},
                UpdateExpression="SET #s = :status, #sent = :sent, #failed = :failed, #total = :total, #updatedAt = :updatedAt",
                ExpressionAttributeNames={
                    '#s': 'status',
                    '#sent': 'sentCount',
                    '#failed': 'failedCount',
                    '#total': 'totalRecipients',
                    '#updatedAt': 'updatedAt'
                },
                ExpressionAttributeValues={
                    ':status': campaign_status,
                    ':sent': sent_final,
                    ':failed': failed_final,
                    ':total': total_count,
                    ':updatedAt': datetime.now().isoformat()
                }
            )
            print(f"Updated campaign {campaign_id} stats.")

        except Exception as e:
            print(f"Error updating stats: {str(e)}")

        return api_response(200, {
            'message': 'Campaign processing completed',
            'sent_count': sent_count, # Using the counts from the loop for the immediate response
            'failed_count': failed_count,
            'status': campaign_status # Using the determined campaign_status
        })

    except Exception as e:
        print(f"❌ Lambda error: {str(e)}")
        import traceback
        traceback.print_exc()
        return api_response(500, {"error": str(e)})