import json
from decimal import Decimal
import db_utils

def lambda_handler(event, context):
    """
    List all contacts with dynamic CORS support (Postgres Version)
    
    GET /contacts
    Optional query params: ?tag=TagName
    """
    
    # Handle OPTIONS preflight request
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        tag_filter = query_params.get('tag')
        
        conn = db_utils.get_db_connection()
        
        if tag_filter:
            # Postgres array containment: tags @> ARRAY['tag']
            sql = "SELECT * FROM email_agent.contacts WHERE tags @> ARRAY[%s]"
            params = [tag_filter]
        else:
            sql = "SELECT * FROM email_agent.contacts"
            params = None
            
        print(f"Executing query: {sql} with params: {params}")
        
        # db_utils.query returns list of dicts
        contacts = db_utils.query(conn, sql, params)
        conn.close()
        
        # Convert keys to camelCase for frontend compatibility
        # DB: first_name -> Frontend: firstName
        frontend_contacts = []
        for c in contacts:
            frontend_contacts.append({
                'contactId': c.get('contact_id'),
                'email': c.get('email'),
                'firstName': c.get('first_name'),
                'lastName': c.get('last_name'),
                'company': c.get('company'),
                'tags': c.get('tags', []),
                'itemType': c.get('item_type'),
                'createdAt': c.get('created_at'),
                'updatedAt': c.get('updated_at')
            })
        
        print(f"Found {len(frontend_contacts)} contacts")
        
        return cors_response(200, {
            'contacts': frontend_contacts,
            'count': len(frontend_contacts)
        }, event)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return cors_response(500, {'error': f'Internal server error: {str(e)}'}, event)


def cors_response(status_code, data, event):
    """Return response with dynamic CORS headers"""
    # Get origin from request
    origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin') or '*'
    
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data, default=str)
    }
