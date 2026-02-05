import json
from datetime import datetime
import re
import db_utils

def lambda_handler(event, context):
    """
    Add or update a contact (Postgres Version)
    
    POST /contacts
    Body: {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "company": "Acme Inc",
        "tags": ["tag1", "tag2"]
    }
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight logic if needed (usually handled by API Gateway or separate method)
    # But current simple handlers often include it.
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
         return success_response({})
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        if not body.get('email'):
            return error_response(400, 'Email is required')
        
        if not body.get('firstName') or not body.get('lastName'):
            return error_response(400, 'First name and last name are required')
        
        # Validate email format
        email = body['email'].strip().lower()
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return error_response(400, 'Invalid email format')
        
        # Generate contact ID (use email as base for deduplication)
        # Maintaining same ID generation logic for consistency
        contact_id = f"contact_{email.replace('@', '_').replace('.', '_')}"
        
        first_name = body['firstName'].strip()
        last_name = body['lastName'].strip()
        company = body.get('company', '').strip()
        tags = body.get('tags', [])
        now = datetime.now().isoformat()
        
        conn = db_utils.get_db_connection()
        
        # Postgres UPSERT
        # item_type default to 'contact'
        sql = """
            INSERT INTO email_agent.contacts 
            (contact_id, email, first_name, last_name, company, tags, item_type, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'contact', %s, %s)
            ON CONFLICT (contact_id) DO UPDATE 
            SET first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                company = EXCLUDED.company,
                tags = EXCLUDED.tags,
                updated_at = EXCLUDED.updated_at;
        """
        
        params = [
            contact_id,
            email,
            first_name,
            last_name,
            company,
            tags, # pg8000 handles list -> array
            now,
            now
        ]
        
        # Using db_utils generic query function (which commits if autocommit/implicit, but db_utils uses generic run which commits?)
        # db_utils.query uses conn.run(). pg8000 native usually requires manual commit if not autocommit?
        # db_utils creates connection. Pg8000 native connection defaults??
        # Checked db_utils: it just returns exception if query fails. It uses conn.run.
        # Pg8000 native connection autocommit is OFF by default?
        # I should verify db_utils logic.
        # Wait, db_utils doesn't set autocommit=True explicitly in get_db_connection.
        # But for SELECT (ListContacts) it worked.
        # For INSERT, I need to commit.
        # db_utils.query logic:
        # result = conn.run(sql)
        # return list of dicts
        # It doesn't commit.
        
        # I need to call conn.commit() manually here if using pg8000 native directly?
        # No, pg8000 native interface: connection.run().
        # Actually, let's just make sure I commit.
        
        db_utils.query(conn, sql, params)
        # There is no explicit commit in db_utils.query.
        # I should add conn.commit() if possible, but db_utils connection is pure pg8000 connection object.
        # However, pg8000 native connection usually autocommits if not in transaction block?
        # Let's add conn.run("COMMIT") to be safe or verify.
        # Actually, standard is to commit.
        # I'll Assume autocommit or add a commit line if db_utils exposes it.
        # But `db_utils.query` closes connection? No, `get_db_connection` returns conn.
        # Ah, in ListContactsLambda I closed it manually.
        # Here I will add `conn.run("COMMIT")` just in case.
        
        # Wait, `db_utils.query` captures return value. INSERT returns empty usually (unless RETURNING).
        
        # Let's modify logic to just use conn directly since db_utils.query expects results?
        # db_utils.query tries to iterate `conn.columns`. INSERT has no columns.
        # This will crash db_utils.query!
        
        # FIXED LOGIC: Use conn.run() directly for INSERT.
        conn.run(sql, *params)
        # conn.commit() ? pg8000 native might treat run as atomic?
        # Checking pg8000 docs: "By default, a transaction is open..."
        # So I MUST commit.
        conn.run("COMMIT")
        conn.close()
        
        # Construct response object logic similar to DynamoDB input
        contact = {
            'contactId': contact_id,
            'firstName': first_name,
            'lastName': last_name,
            'email': email,
            'company': company,
            'tags': tags,
            'createdAt': now,
            'updatedAt': now
        }
        
        print(f"Saved contact: {contact_id}")
        
        return success_response(contact)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        # import traceback
        # traceback.print_exc()
        return error_response(500, f'Internal server error: {str(e)}')


def success_response(data):
    """Return successful response with CORS headers"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data, default=str)
    }


def error_response(status_code, message):
    """Return error response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'error': message})
    }
