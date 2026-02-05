import json
import boto3
import os
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
config_table = dynamodb.Table('SystemConfig')

# PLACEHOLDERS
ZOHO_CLIENT_ID = os.environ.get('ZOHO_CLIENT_ID', '1000.RTTVTRWBP9AZYN7GOWN74LGVXEUNHV')
ZOHO_CLIENT_SECRET = os.environ.get('ZOHO_CLIENT_SECRET', '48b8ecdd40b6ab9f0f9f76ed832f442dae9c8a7620')
# Redirect URI should be the API Gateway URL + /auth/zoho/token or the frontend callback
# Since this is a unified lambda, paths change?
# Existing Redirect URI: http://localhost:3000/auth/callback (for local dev) or production URL.
# The user likely has this configured in Zoho console.
REDIRECT_URI = 'http://localhost:3000/auth/callback' 

def handle_zoho(event, context):
    path = event.get('path') or event.get('rawPath') or ''
    
    if '/url' in path or 'auth-url' in path:
        return handle_auth_url(event)
    elif '/token' in path:
        return handle_token_exchange(event)
    else:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Auth route not found'})}

def handle_auth_url(event):
    scope = 'ZohoMail.messages.CREATE,ZohoMail.messages.UPDATE,ZohoMail.accounts.READ'
    auth_url = (
        f"https://accounts.zoho.com/oauth/v2/auth?"
        f"scope={scope}&"
        f"client_id={ZOHO_CLIENT_ID}&"
        f"response_type=code&"
        f"access_type=offline&"
        f"redirect_uri={REDIRECT_URI}&"
        f"prompt=consent"
    )
    return {'statusCode': 200, 'body': json.dumps({'url': auth_url})}

def handle_token_exchange(event):
    try:
        body = json.loads(event.get('body', '{}'))
        code = body.get('code')
        
        if not code:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing code'})}
            
        token_url = "https://accounts.zoho.com/oauth/v2/token"
        params = urllib.parse.urlencode({
            'code': code,
            'client_id': ZOHO_CLIENT_ID,
            'client_secret': ZOHO_CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI,
            'grant_type': 'authorization_code'
        }).encode('utf-8')
        
        req = urllib.request.Request(token_url, data=params, method='POST')
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
        if 'error' in result:
             return {'statusCode': 400, 'body': json.dumps({'error': result.get('error')})}
             
        access_token = result.get('access_token')
        refresh_token = result.get('refresh_token')
        expires_in = result.get('expires_in', 3600)
        expires_at = (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat()
        
        # Get Account Info
        account_id = None
        user_email = None
        try:
            req_check = urllib.request.Request(
                "https://mail.zoho.com/api/accounts",
                 headers={'Authorization': f"Zoho-oauthtoken {access_token}"},
                 method='GET'
            )
            with urllib.request.urlopen(req_check) as resp_check:
                check_data = json.loads(resp_check.read().decode('utf-8'))
                accounts = check_data.get('data', [])
                if accounts:
                    primary = accounts[0]
                    account_id = primary.get('accountId')
                    user_email = primary.get('incomingUserName')
        except Exception as e:
            print(f"Warning: Failed to fetch account info: {e}")

        # Save to DynamoDB
        item = {
            'configId': 'current_session',
            'accessToken': access_token,
            'refreshToken': refresh_token, # Might be None if not provided (re-auth?)
            'expiresAt': expires_at,
            'updatedAt': datetime.utcnow().isoformat()
        }
        if refresh_token: item['refreshToken'] = refresh_token
        if account_id: item['accountId'] = str(account_id)
        if user_email: item['email'] = user_email

        config_table.put_item(Item=item)
        
        return {'statusCode': 200, 'body': json.dumps({
            'success': True,
            'expiresIn': expires_in,
            'email': user_email
        })}
        
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
