import json
from datetime import datetime
import db_utils

def list_tags(event, context):
    try:
        conn = db_utils.get_db_connection()
        sql = "SELECT * FROM email_agent.contact_tags ORDER BY tag_name"
        tags = db_utils.query(conn, sql)
        conn.close()
        
        # Format
        tags_list = []
        for t in tags:
            tags_list.append({
                'tagName': t.get('tag_name'),
                'description': t.get('description', ''),
                'color': t.get('color', '#3b82f6')
            })
            
        return {
            'statusCode': 200,
            'body': json.dumps({'tags': tags_list, 'count': len(tags_list)}, default=str)
        }
    except Exception as e:
        print(f"ListTags Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def create_tag(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        tag_name = body.get('tagName')
        
        if not tag_name:
             return {'statusCode': 400, 'body': json.dumps({'error': 'Tag name is required'})}
             
        description = body.get('description', '')
        color = body.get('color', '#3b82f6')
        now = datetime.now().isoformat()
        
        conn = db_utils.get_db_connection()
        sql = """
            INSERT INTO email_agent.contact_tags (tag_name, description, color, created_at)
            VALUES (:tag_name, :description, :color, :created_at)
            ON CONFLICT (tag_name) DO UPDATE 
            SET color = EXCLUDED.color, description = EXCLUDED.description;
        """
        conn.run(sql, tag_name=tag_name, description=description, color=color, created_at=now)
        conn.run("COMMIT")
        conn.close()
        
        return {'statusCode': 200, 'body': json.dumps({'message': 'Tag created', 'tagName': tag_name})}
        
    except Exception as e:
        print(f"CreateTag Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def delete_tag(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        tag_name = body.get('tagName')
        
        if not tag_name:
             return {'statusCode': 400, 'body': json.dumps({'error': 'Tag name is required'})}
             
        conn = db_utils.get_db_connection()
        
        # 1. Delete the tag definition
        sql_delete_tag = "DELETE FROM email_agent.contact_tags WHERE tag_name = :tag_name"
        conn.run(sql_delete_tag, tag_name=tag_name)
        print(f"DEBUG: Deleted tag definition: {tag_name}")
        
        # 2. Remove tag from all contacts that have it (Sync)
        # Using PostgreSQL array_remove to scrub the deleted tag from the 'tags' array column
        # CAST is important because pg8000 sends params as 'unknown' type often
        sql_remove_from_contacts = """
            UPDATE email_agent.contacts 
            SET tags = array_remove(tags, CAST(:tag_name AS VARCHAR)) 
            WHERE CAST(:tag_name AS VARCHAR) = ANY(tags)
        """
        # Note: pg8000.native run returns keys in a specific way or just None for updates usually, 
        # unless using RETURNING. But we just want to know it ran.
        conn.run(sql_remove_from_contacts, tag_name=tag_name)
        print(f"DEBUG: Executed tag cleanup from contacts for: {tag_name}")
        
        conn.run("COMMIT")
        conn.close()
        
        return {'statusCode': 200, 'body': json.dumps({'message': 'Tag deleted', 'tagName': tag_name})}
        
    except Exception as e:
        print(f"DeleteTag Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
