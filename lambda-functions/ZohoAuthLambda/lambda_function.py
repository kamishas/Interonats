import boto3
import json
import os
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
config_table = dynamodb.Table('SystemConfig')

# PLACEHOLDERS - To be filled by user input or environment variables
ZOHO_CLIENT_ID = os.environ.get('ZOHO_CLIENT_ID', '1000.RTTVTRWBP9AZYN7GOWN74LGVXEUNHV')
ZOHO_CLIENT_SECRET = os.environ.get('ZOHO_CLIENT_SECRET', '48b8ecdd40b6ab9f0f9f76ed832f442dae9c8a7620')
REDIRECT_URI = 'http://localhost:3000/auth/callback' # Local dev default

def lambda_handler(event, context):
    """
    Handle Zoho Auth Flow:
    1. GET /auth-url: Generate authorization URL
    2. POST /token: Exchange code for access_token
    """
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)

    # Support both REST API (path) and HTTP API (rawPath)
    path = event.get('path') or event.get('rawPath') or ''
    print(f"Detected Path: {path}")
    
    try:
        # Match /auth/zoho/url
        if '/url' in path or 'auth-url' in path:
            return handle_auth_url(event)
        # Match /auth/zoho/token
        elif '/token' in path:
            return handle_token_exchange(event)
        else:
            print(f"Path not found: {path}")
            return cors_response(404, {'error': 'Not Found', 'path': path}, event)
            
    except Exception as e:
        print(f"Error: {e}")
        return cors_response(500, {'error': str(e)}, event)

def handle_auth_url(event):
    """Generate Zoho OAuth URL"""
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
    
    return cors_response(200, {'url': auth_url}, event)

def handle_token_exchange(event):
    """Exchange authorization code for access token"""
    body = json.loads(event.get('body', '{}'))
    code = body.get('code')
    
    if not code:
        return cors_response(400, {'error': 'Missing authorization code'}, event)
        
    # Call Zoho Token API
    token_url = "https://accounts.zoho.com/oauth/v2/token"
    params = urllib.parse.urlencode({
        'code': code,
        'client_id': ZOHO_CLIENT_ID,
        'client_secret': ZOHO_CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }).encode('utf-8')
    
    try:
        req = urllib.request.Request(token_url, data=params, method='POST')
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
        if 'error' in result:
            return cors_response(400, {'error': result.get('error')}, event)
            
        access_token = result.get('access_token')
        refresh_token = result.get('refresh_token')
        expires_in = result.get('expires_in', 3600)
        
        # Calculate expiry
        expires_at = (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat()
        
        # Format: Fetch Account Info to get the correct Email/AccountId
        account_id = None
        user_email = None
        
        try:
             # Add delay to let token propagate? Usually instant.
            req_check = urllib.request.Request(
                "https://mail.zoho.com/api/accounts",
                 headers={'Authorization': f"Zoho-oauthtoken {access_token}"},
                 method='GET'
            )
            with urllib.request.urlopen(req_check) as resp_check:
                check_data = json.loads(resp_check.read().decode('utf-8'))
                # Zoho response structure: { "data": [ { "accountId": "...", "incomingUserName": "..." } ] }
                accounts = check_data.get('data', [])
                if accounts:
                    primary = accounts[0] # Use first account
                    account_id = primary.get('accountId')
                    user_email = primary.get('incomingUserName') # This is the email
                    print(f"Discovered User: {user_email} (ID: {account_id})")
        except Exception as e:
            print(f"Warning: Failed to fetch account info: {e}")

        # Save to DynamoDB
        # We store this as the "current_session"
        item = {
            'configId': 'current_session',
            'accessToken': access_token,
            'refreshToken': refresh_token,
            'expiresAt': expires_at,
            'updatedAt': datetime.utcnow().isoformat()
        }
        if account_id:
            item['accountId'] = str(account_id)
        if user_email:
            item['email'] = user_email

        config_table.put_item(Item=item)

        return cors_response(200, {
            'success': True,
            'expiresIn': expires_in,
            'expiresAt': expires_at,
            'email': user_email # Return to frontend for UI
        }, event)
        
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"Zoho Token API Error: {e.code} - {error_body}")
        return cors_response(e.code, {'error': f"Zoho Error: {error_body}"}, event)
        
    except Exception as e:
        print(f"Token exchange failed: {e}")
        # Return the actual error message for debugging
        return cors_response(500, {'error': f"Internal Error: {str(e)}"}, event)

def cors_response(status_code, data, event):
    """Return response with dynamic CORS headers"""
    origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin') or '*'
    
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data)
    }
