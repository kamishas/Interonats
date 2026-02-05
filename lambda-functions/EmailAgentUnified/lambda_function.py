import json
import logging

# Setup Logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

INIT_ERROR = None
handlers = None

try:
    from handlers import contacts, campaigns, recipients, tags, auth, compliance
except Exception as e:
    INIT_ERROR = str(e)
    logger.error(f"Init Error: {e}", exc_info=True)

def lambda_handler(event, context):
    """
    Unified Email Agent Handler
    Routers requests to appropriate sub-handlers.
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    # CORS Preflight (Always handle this first, even if init failed)
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS' or event.get('httpMethod') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)

    # Check for Init Error
    if INIT_ERROR:
        return error_response(500, f"Lambda Init Error: {INIT_ERROR}", event)

    # Determine Route
    # Support both HTTP API (v2) and REST API (v1) formats
    path = event.get('rawPath') or event.get('path', '/')
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    
    logger.info(f"Route: {method} {path}")
    
    try:
        response = None
        
        # --- ROUTING TABLE ---
        
        # AUTH
        if '/auth/zoho' in path:
             response = auth.handle_zoho(event, context)

        # CONTACTS
        elif path == '/contacts':
            if method == 'GET':
                response = contacts.list_contacts(event, context)
            elif method == 'POST':
                response = contacts.add_contact(event, context)
        
        elif path.startswith('/contacts/') and method == 'DELETE':
            # Extract ID: /contacts/123 -> 123
            contact_id = path.split('/')[-1]
            response = contacts.delete_contact(event, context, contact_id)
            
        # CAMPAIGNS
        elif path == '/campaigns':
            if method == 'GET':
                 response = campaigns.list_campaigns(event, context)
            elif method == 'POST':
                 response = campaigns.create_campaign(event, context)
        
        elif path.startswith('/campaigns/'):
            parts = path.split('/')
            campaign_id = parts[2]
            
            # /campaigns/{id}
            if len(parts) == 3:
                if method == 'GET':
                    response = campaigns.get_campaign(event, context, campaign_id)
            
            # /campaigns/{id}/config
            elif len(parts) == 4 and parts[3] == 'config' and method == 'POST':
                response = campaigns.update_campaign_config(event, context, campaign_id)

            # /campaigns/{id}/send
            elif len(parts) == 4 and parts[3] == 'send' and method == 'POST':
                response = campaigns.send_campaign(event, context, campaign_id)
                
            # /campaigns/{id}/recipients
            elif len(parts) == 4 and parts[3] == 'recipients':
                 response = recipients.manage_recipients(event, context, campaign_id)

        # TAGS
        elif path == '/tags' or path == '/contacts/tags':
            if method == 'GET':
                response = tags.list_tags(event, context)
            elif method == 'POST':
                response = tags.create_tag(event, context)
            elif method == 'DELETE':
                # Frontend might use POST with body for delete, or DELETE method.
                # api.ts says: deleteTag uses DELETE method on /contacts/tags
                response = tags.delete_tag(event, context)
        
        # COMPLIANCE
        elif path == '/compliance/check' and method == 'POST':
            response = compliance.check_text_compliance(event, context)

        # 404 Not Found
        if response is None:
            return error_response(404, f"Route not found: {method} {path}", event)
            
        # Inject CORS
        return add_cors_headers(response, event)

    except Exception as e:
        logger.error(f"Internal Error: {str(e)}", exc_info=True)
        return error_response(500, f"Internal Server Error: {str(e)}", event)

def cors_response(status_code, data, event):
    # Logic similar to previous lambdas
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
        'body': json.dumps(data, default=str)
    }

def error_response(status_code, message, event=None):
    origin = '*'
    if event:
        origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin') or '*'
        
    return {
        'statusCode': status_code,
        'headers': {
             'Access-Control-Allow-Origin': origin,
             'Access-Control-Allow-Credentials': 'true',
             'Content-Type': 'application/json'
        },
        'body': json.dumps({'error': message})
    }

def add_cors_headers(response, event):
    if not response: return response
    
    headers = response.get('headers', {})
    
    origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin') or '*'
    
    headers.update({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin'
    })
    
    response['headers'] = headers
    return response
