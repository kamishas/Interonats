import json
from datetime import datetime
import re
import db_utils

# --- LIST CONTACTS ---
def list_contacts(event, context):
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        tag_filter = query_params.get('tag')
        
        conn = db_utils.get_db_connection()
        
        if tag_filter:
            sql = "SELECT * FROM email_agent.contacts WHERE tags @> ARRAY[:tag]"
            params = {'tag': tag_filter}
        else:
            sql = "SELECT * FROM email_agent.contacts"
            params = {}
            
        print(f"Executing query: {sql} with params: {params}")
        contacts = db_utils.query(conn, sql, params)
        conn.close()
        
        # Format for frontend
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
        
        return {
            'statusCode': 200,
            'body': json.dumps({'contacts': frontend_contacts, 'count': len(frontend_contacts)}, default=str)
        }
    except Exception as e:
        print(f"ListContacts Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

# --- ADD CONTACT ---
def add_contact(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        
        if not body.get('email'):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Email is required'})}
        
        if not body.get('firstName') or not body.get('lastName'):
             return {'statusCode': 400, 'body': json.dumps({'error': 'First name and last name are required'})}
        
        email = body['email'].strip().lower()
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
             return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid email format'})}
             
        contact_id = f"contact_{email.replace('@', '_').replace('.', '_')}"
        first_name = body['firstName'].strip()
        last_name = body['lastName'].strip()
        company = body.get('company', '').strip()
        tags = body.get('tags', [])
        now = datetime.now().isoformat()
        
        conn = db_utils.get_db_connection()
        
        sql = """
            INSERT INTO email_agent.contacts 
            (contact_id, email, first_name, last_name, company, tags, item_type, created_at, updated_at)
            VALUES (:contact_id, :email, :first_name, :last_name, :company, :tags, 'contact', :created_at, :updated_at)
            ON CONFLICT (contact_id) DO UPDATE 
            SET first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                company = EXCLUDED.company,
                tags = EXCLUDED.tags,
                updated_at = EXCLUDED.updated_at;
        """
        params = {
            'contact_id': contact_id,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'company': company,
            'tags': tags,
            'created_at': now,
            'updated_at': now
        }
        
        conn.run(sql, **params)
        conn.run("COMMIT")
        conn.close()
        
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
        
        return {'statusCode': 200, 'body': json.dumps(contact, default=str)}
        
    except Exception as e:
        print(f"AddContact Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

# --- DELETE CONTACT ---
def delete_contact(event, context, contact_id):
    try:
        conn = db_utils.get_db_connection()
        sql = "DELETE FROM email_agent.contacts WHERE contact_id = :contact_id"
        conn.run(sql, contact_id=contact_id)
        conn.run("COMMIT")
        conn.close()
        
        return {'statusCode': 200, 'body': json.dumps({'message': 'Contact deleted', 'id': contact_id})}
    except Exception as e:
        print(f"DeleteContact Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
