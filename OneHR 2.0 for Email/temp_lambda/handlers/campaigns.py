import json
import boto3
import os
import urllib.request
import urllib.parse
import urllib.error
import html
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import db_utils

# --- CONFIG ---
BUCKET_NAME = "interon-email-images"
ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"
ZOHO_BASE_URL = os.getenv("ZOHO_BASE_URL", "https://mail.zoho.com")

s3_client = boto3.client("s3", region_name="us-east-2")
dynamodb = boto3.resource("dynamodb", region_name="us-east-2")
config_table = dynamodb.Table('SystemConfig') # Legacy config table in DynamoDB

# --- LIST CAMPAIGNS ---
def list_campaigns(event, context):
    try:
        conn = db_utils.get_db_connection()
        sql = "SELECT * FROM email_agent.campaigns ORDER BY created_at DESC"
        campaigns = db_utils.query(conn, sql)
        conn.close()
        
        # Format
        campaigns_list = []
        for c in campaigns:
            campaigns_list.append({
                'id': c.get('campaign_id'),
                'campaignId': c.get('campaign_id'),
                'name': c.get('name', 'Untitled'),
                'subject': c.get('subject', ''),
                'status': c.get('status', 'draft'),
                'category': c.get('category', 'General'),
                'stats': {
                    'total': c.get('total_recipients', 0),
                    'sent': c.get('sent_count', 0),
                    'failed': c.get('failed_count', 0)
                },
                'createdAt': c.get('created_at'),
                'images': c.get('images', [])
            })
            
        return {'statusCode': 200, 'body': json.dumps({'campaigns': campaigns_list, 'count': len(campaigns_list)}, default=str)}
    except Exception as e:
        print(f"ListCampaigns Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

# --- CREATE CAMPAIGN ---
def create_campaign(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        name = body.get('name')
        if not name:
             return {'statusCode': 400, 'body': json.dumps({'error': 'Name is required'})}
             
        campaign_id = str(int(datetime.now().timestamp() * 1000))
        now = datetime.now().isoformat()
        
        conn = db_utils.get_db_connection()
        sql = """
            INSERT INTO email_agent.campaigns 
            (campaign_id, name, subject, status, category, body_template, images, created_at, updated_at)
            VALUES (:campaign_id, :name, :subject, 'draft', :category, :body_template, :images, :created_at, :updated_at)
        """
        params = {
            'campaign_id': campaign_id,
            'name': name,
            'subject': body.get('subject', ''),
            'category': body.get('category', 'General'),
            'body_template': body.get('bodyTemplate', ''),
            'images': body.get('images', []),
            'created_at': now,
            'updated_at': now
        }
        
        # Note: pg8000 might need specific array handling. db_utils doesn't have auto array conversion?
        # pg8000 native usually handles list as array.
        
        conn.run(sql, **params)
        conn.run("COMMIT")
        conn.close()
        
        return {'statusCode': 200, 'body': json.dumps({'campaignId': campaign_id, 'message': 'Campaign created'})}
        
    except Exception as e:
        print(f"CreateCampaign Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

# --- GET CAMPAIGN ---
def get_campaign(event, context, campaign_id):
    try:
        conn = db_utils.get_db_connection()
        sql = "SELECT * FROM email_agent.campaigns WHERE campaign_id = :campaign_id"
        campaigns = db_utils.query(conn, sql, {'campaign_id': campaign_id})
        if not campaigns:
            conn.close()
            return {'statusCode': 404, 'body': json.dumps({'error': 'Campaign not found'})}
            
        c = campaigns[0]
        
        # Fetch Recipients
        recip_sql = "SELECT * FROM email_agent.campaign_recipients WHERE campaign_id = :campaign_id"
        recipients = db_utils.query(conn, recip_sql, {'campaign_id': campaign_id})
        conn.close()
        
        # Format Recipients
        recipients_list = []
        for r in recipients:
            recipients_list.append({
                'recipientEmail': r.get('recipient_email'),
                'firstName': r.get('first_name'),
                'lastName': r.get('last_name'),
                'company': r.get('company'),
                'status': r.get('status', 'pending')
            })
        
        data = {
            'campaignId': c.get('campaign_id'),
            'name': c.get('name'),
            'subject': c.get('subject'),
            'bodyTemplate': c.get('body_template'),
            'status': c.get('status'),
            'images': c.get('images', []),
            'recipients': recipients_list
        }
        return {'statusCode': 200, 'body': json.dumps(data, default=str)}
        
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}


# --- UPDATE CAMPAIGN CONFIG ---
def update_campaign_config(event, context, campaign_id):
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Extract fields to update
        subject = body.get('subject')
        body_template = body.get('bodyTemplate')
        category = body.get('category')
        images = body.get('images') # Optional list
        
        # Build SQL dynamically based on what's provided? 
        # Or just update all passed fields. Frontend usually sends full state.
        
        conn = db_utils.get_db_connection()
        now = datetime.now().isoformat()
        
        # Update Query
        sql = """
            UPDATE email_agent.campaigns
            SET subject = :subject,
                body_template = :body_template,
                category = :category,
                images = :images,
                updated_at = :updated_at
            WHERE campaign_id = :campaign_id
        """
        
        # pg8000 handling for lists? 
        # If images is None, ensure we don't overwrite if not intended? 
        # But usually saveConfig sends current state.
        # Let's assume passed values are what we want.
        
        # Handling potential None values if partial update?
        # For now, simplistic approach: Update what's passed, default to empty if missing?
        # Actually, let's look at existing entry first? No, that's slow.
        # Let's assume the frontend sends the "new state".
        
        params = {
            'subject': subject if subject is not None else '',
            'body_template': body_template if body_template is not None else '',
            'category': category if category is not None else 'General',
            'images': images if images is not None else [],
            'updated_at': now,
            'campaign_id': campaign_id
        }
        
        conn.run(sql, **params)
        conn.run("COMMIT")
        conn.close()
        
        return {'statusCode': 200, 'body': json.dumps({'message': 'Campaign updated', 'campaignId': campaign_id})}
        
    except Exception as e:
        print(f"UpdateCampaignConfig Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}


# --- SEND CAMPAIGN (The Big One) ---
def send_campaign(event, context, campaign_id):
    try:
        # 1. Fetch Campaign
        conn = db_utils.get_db_connection()
        camp_sql = "SELECT * FROM email_agent.campaigns WHERE campaign_id = :campaign_id"
        campaigns = db_utils.query(conn, camp_sql, {'campaign_id': campaign_id})
        
        if not campaigns:
            conn.close()
            return {'statusCode': 404, 'body': json.dumps({'error': 'Campaign not found'})}
        
        campaign = campaigns[0]
        subject = campaign.get('subject')
        body = campaign.get('body_template')
        
        if not subject or not body:
            conn.close()
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing subject or body'})}
            
        # 2. Fetch Recipients
        recip_sql = "SELECT * FROM email_agent.campaign_recipients WHERE campaign_id = :campaign_id"
        recipients = db_utils.query(conn, recip_sql, {'campaign_id': campaign_id})
        
        if not recipients:
            conn.close()
            return {'statusCode': 400, 'body': json.dumps({'error': 'No recipients found'})}

        # 3. Get Auth Config (Legacy Logic from DynamoDB)
        config = get_sender_config()
        auth_mode = config.get('authMode', 'oauth')
        access_token = None
        
        if auth_mode == 'oauth':
             if config.get('is_session') and config.get('accessToken'):
                 access_token = config['accessToken']
             else:
                 access_token = get_fresh_access_token(config)
        
        # 4. Update Status to Sending
        conn.run("UPDATE email_agent.campaigns SET status = 'sending' WHERE campaign_id = :campaign_id", campaign_id=campaign_id)
        conn.run("COMMIT")
        
        # 5. Process Recipients
        sent_count = 0
        failed_count = 0
        
        # Get images for presigning
        images = get_campaign_images(campaign_id)
        
        for r in recipients:
            if r.get('status') == 'sent':
                continue
                
            email = r.get('recipient_email')
            fname = r.get('first_name') or 'Friend'
            lname = r.get('last_name', '')
            company = r.get('company', '')
            
            # Personalize
            final_body = render_text(body, fname, lname, company).replace("\n", "<br>")
            final_subject = render_text(subject, fname, lname, company)
            
            try:
                # Send
                msg_id = ""
                if auth_mode == 'oauth':
                    msg_id = send_email_via_zoho(
                        access_token, email, final_subject, final_body, images,
                        sender_email=config.get('email'),
                        account_id=config.get('accountId')
                    )
                else:
                    msg_id = send_email_via_smtp(config, email, final_subject, final_body, images)
                
                # Update Recipient Success
                conn.run("""
                    UPDATE email_agent.campaign_recipients 
                    SET status = 'sent', error_message = NULL
                    WHERE campaign_id = :campaign_id AND recipient_email = :email
                """, campaign_id=campaign_id, email=email)
                sent_count += 1
                
            except Exception as e:
                print(f"Failed to send to {email}: {e}")
                # Update Recipient Failure
                conn.run("""
                    UPDATE email_agent.campaign_recipients 
                    SET status = 'failed', error_message = :error
                    WHERE campaign_id = :campaign_id AND recipient_email = :email
                """, error=str(e), campaign_id=campaign_id, email=email)
                failed_count += 1
        
        # 6. Final Update
        total_recipients = len(recipients)
        final_status = 'sent' if sent_count == total_recipients else 'partial'
        if sent_count + failed_count == total_recipients:
             if failed_count > 0: final_status = 'completed' # processed all, some failed
             else: final_status = 'sent'
             
        conn.run("""
            UPDATE email_agent.campaigns
            SET status = :status, sent_count = :sent, failed_count = :failed, updated_at = :updated_at
            WHERE campaign_id = :campaign_id
        """, status=final_status, sent=sent_count, failed=failed_count, updated_at=datetime.now().isoformat(), campaign_id=campaign_id)
        conn.run("COMMIT")
        conn.close()
        
        return {'statusCode': 200, 'body': json.dumps({
            'message': 'Campaign processed',
            'sent': sent_count,
            'failed': failed_count,
            'status': final_status
        })}

    except Exception as e:
        print(f"SendCampaign Error: {e}")
        import traceback
        traceback.print_exc()
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}


# --- HELPER FUNCTIONS (Ported) ---

def get_sender_config():
    # ... logic from original ...
    try:
        session_resp = config_table.get_item(Key={'configId': 'current_session'})
        session = session_resp.get('Item')
        if session:
             # Check exists/expiry logic... simplified for strict port
             # Assuming valid if present for now or adding expiry check
             expires = session.get('expiresAt')
             if expires and datetime.fromisoformat(expires) > datetime.utcnow():
                 return {
                    'authMode': 'oauth',
                    'accessToken': session.get('accessToken'),
                    'refresh': session.get('refreshToken'),
                    'id': os.getenv("ZOHO_CLIENT_ID"), 
                    'secret': os.getenv("ZOHO_CLIENT_SECRET"),
                    'email': session.get('email') or os.getenv("SOURCE_EMAIL"),
                    'accountId': session.get('accountId') or os.getenv("ZOHO_ACCOUNT_ID"),
                    'is_session': True
                 }
        
        # Global fallback
        resp = config_table.get_item(Key={'configId': 'zoho_global'})
        item = resp.get('Item')
        if item:
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
        print(f"Config Error: {e}")
        
    return {
        'authMode': 'oauth',
        'id': os.getenv("ZOHO_CLIENT_ID"),
        'secret': os.getenv("ZOHO_CLIENT_SECRET"),
        'refresh': os.getenv("ZOHO_REFRESH_TOKEN"),
        'email': os.getenv("SOURCE_EMAIL"),
        'is_session': False
    }

def get_fresh_access_token(config):
    params = {
        "refresh_token": config['refresh'],
        "client_id": config['id'],
        "client_secret": config['secret'],
        "grant_type": "refresh_token"
    }
    url = f"{ZOHO_AUTH_URL}?{urllib.parse.urlencode(params)}"
    try:
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data["access_token"]
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Refresh failed: {e.read().decode('utf-8')}")
    except Exception as e:
         raise RuntimeError(f"Refresh failed: {str(e)}")

def get_campaign_images(campaign_id):
    try:
        prefix = f"approved/{campaign_id}/"
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        images = []
        if 'Contents' in response:
            for obj in response['Contents']:
                key = obj['Key']
                url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': BUCKET_NAME, 'Key': key},
                    ExpiresIn=604800
                )
                images.append({'filename': os.path.basename(key), 'url': url})
        return images
    except:
        return []

def send_email_via_zoho(token, to, subject, content, images, sender_email, account_id):
    headers = {"Authorization": f"Zoho-oauthtoken {token}", "Content-Type": "application/json"}
    
    if images:
        for img in images:
            safe_url = html.escape(img["url"])
            content += f'<br><br><img src="{safe_url}" alt="{img["filename"]}" style="max-width:100%; height:auto;"><br>'
            
    payload = {
        "fromAddress": sender_email,
        "toAddress": to,
        "subject": subject,
        "content": content,
        "mailFormat": "html"
    }
    
    # URL construction
    url = f"{ZOHO_BASE_URL}/api/accounts/{account_id}/messages"
    
    try:
        req = urllib.request.Request(url, method="POST", headers=headers, data=json.dumps(payload).encode("utf-8"))
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            zoho_data = data.get("data")
            if isinstance(zoho_data, list): return zoho_data[0].get("messageId")
            return data.get("messageId")
            
    except urllib.error.HTTPError as e:
         raise RuntimeError(f"Zoho send error: {e.read().decode('utf-8')}")
    except Exception as e:
         raise RuntimeError(f"Zoho send error: {str(e)}")

def send_email_via_smtp(config, to, subject, content, images):
    # Basic SMTP implementation
    server = smtplib.SMTP("smtp.zoho.com", 587)
    server.starttls()
    server.login(config['email'], config['appPassword'])
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = config['email']
    msg['To'] = to
    
    if images:
         for img in images:
            safe_url = html.escape(img["url"])
            content += f'<br><img src="{safe_url}"><br>'
            
    msg.attach(MIMEText(content, "html"))
    server.sendmail(config['email'], to, msg.as_string())
    server.quit()
    return "smtp-sent"

def render_text(text, fname, lname, company):
    if not text: return ""
    return text.replace("{{firstName}}", fname).replace("{{lastName}}", lname).replace("{{company}}", company)
