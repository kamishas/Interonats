import json
import boto3
import os

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
config_table = dynamodb.Table('SystemConfig')

def lambda_handler(event, context):
    """
    Manage System Configs (GET/POST)
    """
    print(f"Event: {json.dumps(event)}")
    
    # CORS
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
    if http_method == 'OPTIONS':
         return cors_response(200, {'message': 'OK'}, event)

        # GET Auth URL
        elif http_method == 'GET' and event.get('resource') == '/config/auth-url' or (event.get('path') and 'auth-url' in event.get('path')):
            # Params
            query = event.get('queryStringParameters') or {}
            client_id = query.get('clientId')
            client_secret = query.get('clientSecret')
            
            if not client_id:
                return cors_response(400, {'error': 'Missing clientId'}, event)
                
            # Construct Zoho URL
            # Scopes: ZohoMail.messages.CREATE, ZohoMail.messages.UPDATE, ZohoMail.accounts.READ
            redirect_uri = event.get('headers', {}).get('origin') or 'http://localhost:3000'
            # Look for explicit redirect uri if needed, but usually we redirect back to the app
            # If running locally, it's localhost:3000. If deployed, it's the domain.
            # We assume the user is redirecting back to the same page.
            
            # Zoho requires a registered redirect URI. 
            # For this dynamic tool, the user must have registered their app's URL in Zoho Console.
            # We will use the Origin as the redirect URI.
            
            scope = "ZohoMail.messages.CREATE,ZohoMail.messages.UPDATE,ZohoMail.accounts.READ"
            auth_url = f"https://accounts.zoho.com/oauth/v2/auth?scope={scope}&client_id={client_id}&response_type=code&access_type=offline&redirect_uri={redirect_uri}&prompt=consent"
            
            return cors_response(200, {'url': auth_url}, event)

        # POST Auth Callback (Exchange Code)
        elif http_method == 'POST' and (event.get('resource') == '/config/auth-callback' or (event.get('path') and 'auth-callback' in event.get('path'))):
            body = json.loads(event.get('body', '{}'))
            code = body.get('code')
            client_id = body.get('clientId')
            client_secret = body.get('clientSecret')
            
            if not (code and client_id and client_secret):
                return cors_response(400, {'error': 'Missing required fields (code, clientId, clientSecret)'}, event)

            # Exchange for tokens
            redirect_uri = event.get('headers', {}).get('origin') or 'http://localhost:3000'
            
            token_url = f"https://accounts.zoho.com/oauth/v2/token?code={code}&client_id={client_id}&client_secret={client_secret}&redirect_uri={redirect_uri}&grant_type=authorization_code"
            
            import urllib3
            http = urllib3.PoolManager()
            resp = http.request('POST', token_url)
            
            if resp.status != 200:
                return cors_response(400, {'error': f'Token exchange failed: {resp.data.decode("utf-8")}'}, event)
                
            tokens = json.loads(resp.data.decode('utf-8'))
            
            if 'error' in tokens:
                 return cors_response(400, {'error': tokens.get('error')}, event)
                 
            refresh_token = tokens.get('refresh_token')
            access_token = tokens.get('access_token')
            
            if not refresh_token:
                # Sometimes refresh token is not returned if already authorized and prompt!=consent.
                # But we forced prompt=consent.
                # If still missing, we might need to warn user.
                pass

            # Fetch User Profile to get From Email
            # https://mail.zoho.com/api/accounts
            user_resp = http.request('GET', 'https://mail.zoho.com/api/accounts', headers={'Authorization': f'Zoho-oauthtoken {access_token}'})
            from_email = ""
            
            if user_resp.status == 200:
                user_data = json.loads(user_resp.data.decode('utf-8'))
                # Structure: { "data": [ { "primaryEmailAddress": "..." } ] }
                if 'data' in user_data and len(user_data['data']) > 0:
                    from_email = user_data['data'][0].get('primaryEmailAddress')
                    
            # Save to SystemConfig
            item = {
                'configId': 'zoho_global',
                'authMode': 'oauth',
                'clientId': client_id,
                'clientSecret': client_secret,
                'refreshToken': refresh_token,
                'fromEmail': from_email,
                'updatedAt': str(context.aws_request_id)
            }
            
            config_table.put_item(Item=item)
            
            return cors_response(200, {'message': 'success', 'email': from_email}, event)

        # GET Config
        if http_method == 'GET':
            resp = config_table.get_item(Key={'configId': 'zoho_global'})
            item = resp.get('Item', {})
            
            # Mask secrets for security
            if item.get('clientSecret'):
                item['clientSecret'] = '******'
            if item.get('refreshToken'):
                item['refreshToken'] = '******'
            if item.get('appPassword'):
                item['appPassword'] = '******'
                
            return cors_response(200, {'config': item}, event)
            
        # POST Config (Manual Save)
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            auth_mode = body.get('authMode', 'oauth') # default to oauth for backward compat logic
            client_id = body.get('clientId')
            client_secret = body.get('clientSecret')
            refresh_token = body.get('refreshToken')
            from_email = body.get('fromEmail')
            app_password = body.get('appPassword')
            
            # Validation based on mode
            if not from_email:
                 return cors_response(400, {'error': 'From Email is required'}, event)

            if auth_mode == 'oauth':
                if not (client_id and client_secret and refresh_token):
                     return cors_response(400, {'error': 'Missing OAuth fields (Client ID, Secret, Token)'}, event)
            elif auth_mode == 'smtp':
                if not app_password:
                     return cors_response(400, {'error': 'App Password is required for SMTP mode'}, event)
            
            item = {
                'configId': 'zoho_global',
                'authMode': auth_mode,
                'clientId': client_id,
                'clientSecret': client_secret,
                'refreshToken': refresh_token,
                'fromEmail': from_email,
                'appPassword': app_password,
                'updatedAt': str(context.aws_request_id)
            }
            
            config_table.put_item(Item=item)
            return cors_response(200, {'message': 'Configuration saved successfully'}, event)
            
        else:
            return cors_response(405, {'error': 'Method not allowed'}, event)
            
    except Exception as e:
        print(f"Error: {e}")
        return cors_response(500, {'error': str(e)}, event)

def cors_response(status_code, data, event):
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data)
    }
