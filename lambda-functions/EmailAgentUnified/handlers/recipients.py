import json
import time
import uuid
import db_utils

def manage_recipients(event, context, campaign_id):
    # Support both HTTP API (v2) and REST API (v1)
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    
    if method == 'GET':
        return list_recipients(campaign_id)
    elif method == 'POST':
        return add_recipients(event, campaign_id)
    else:
        return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def list_recipients(campaign_id):
    try:
        conn = db_utils.get_db_connection()
        sql = "SELECT * FROM email_agent.campaign_recipients WHERE campaign_id = :campaign_id"
        recipients = db_utils.query(conn, sql, {'campaign_id': campaign_id})
        conn.close()
        
        cleaned = []
        for r in recipients:
            cleaned.append({
                'id': r.get('recipient_id'),
                'email': r.get('recipient_email'),
                'firstName': r.get('first_name', ''),
                'lastName': r.get('last_name', ''),
                'company': r.get('company', ''),
                'status': r.get('status', 'pending')
            })
            
        return {'statusCode': 200, 'body': json.dumps({'recipients': cleaned, 'count': len(cleaned)}, default=str)}
        
    except Exception as e:
         return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def add_recipients(event, campaign_id):
    try:
        body = json.loads(event.get('body', '{}'))
        recipients = body.get('recipients', [])
        
        if not recipients:
             return {'statusCode': 200, 'body': json.dumps({'message': 'No recipients to save'})}
             
        conn = db_utils.get_db_connection()
        
        # Prepare data for execute_values
        data = []
        now = int(time.time())
        
        for r in recipients:
            r_id = r.get('id') or str(uuid.uuid4())
            email = r.get('email')
            if not email: continue
            
            data.append((
                campaign_id,
                email,
                r_id,
                r.get('firstName', ''),
                r.get('lastName', ''),
                r.get('company', ''),
                r.get('status', 'pending'),
                now
            ))
            
        if not data:
             return {'statusCode': 400, 'body': json.dumps({'error': 'No valid recipients'})}

        # Bulk Insert (Upsert to avoid dupes)
        sql = """
            INSERT INTO email_agent.campaign_recipients 
            (campaign_id, recipient_email, recipient_id, first_name, last_name, company, status, added_at)
            VALUES %s
            ON CONFLICT (campaign_id, recipient_email) DO NOTHING
        """
        
        # Need cursor for execute_values. db_utils doesn't expose cursor easily in 'query', 
        # but 'get_db_connection' returns raw pg8000 connection.
        # Postgres execute_values is a psycopg2 helper. pg8000 doesn't have it native?
        # Checking imports... I imported psycopg2.extras execute_values? 
        # But I am using pg8000! execute_values won't work with pg8000 connection object directly 
        # unless pg8000 is compatible or I use manual string building.
        
        # My dependency list has pg8000. 'psycopg2' is NOT installed in the lambda package (I only copied pg8000).
        # So I CANNOT use psycopg2.extras.
        # I must do manual batch insert or loop. 
        # Efficient way in pg8000: conn.run("INSERT ... VALUES (...), (...), ...")
        
        # Construct Value String
        # (campaign_id, email, ...)
        
        # Actually, let's just loop for safety and simplicity given pg8000 limitation without helper.
        # Or build a big query string.
        
        # Bulk Insert (One by one for pg8000 native safety with named params)
        insert_sql = """
            INSERT INTO email_agent.campaign_recipients 
            (campaign_id, recipient_email, recipient_id, first_name, last_name, company, status, added_at)
            VALUES (:campaign_id, :email, :recipient_id, :first_name, :last_name, :company, :status, :added_at)
            ON CONFLICT (campaign_id, recipient_email) DO NOTHING
        """
        
        # Use transaction
        for row in data:
            # row structure from above: (campaign_id, email, r_id, first, last, company, status, now)
            conn.run(insert_sql, 
                campaign_id=row[0],
                email=row[1],
                recipient_id=row[2],
                first_name=row[3],
                last_name=row[4],
                company=row[5],
                status=row[6],
                added_at=row[7]
            )
            
        # Update Total Count on Campaign
        # Native run returns list of lists
        res = conn.run("SELECT COUNT(*) FROM email_agent.campaign_recipients WHERE campaign_id = :campaign_id", campaign_id=campaign_id)
        total_count = res[0][0]
        
        conn.run("UPDATE email_agent.campaigns SET total_recipients = :total WHERE campaign_id = :campaign_id", 
                 total=total_count, campaign_id=campaign_id)
        
        conn.run("COMMIT")
        conn.close()
        
        return {'statusCode': 200, 'body': json.dumps({'message': 'Recipients saved', 'count': len(data)})}

    except Exception as e:
        print(f"ManageRecipients Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
