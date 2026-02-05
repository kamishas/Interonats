import json
import boto3
import uuid
import datetime
from boto3.dynamodb.conditions import Key, Attr

# Initialize DynamoDB clients
dynamodb = boto3.resource('dynamodb')
contacts_table = dynamodb.Table('GlobalContacts')
tags_table = dynamodb.Table('ContactTags')

def lambda_handler(event, context):
    print("Event:", json.dumps(event))
    
    # Enable CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE'
    }
    
    try:
        method = event.get('httpMethod')
        path = event.get('path', '')
        
        if method == 'OPTIONS':
            return {'statusCode': 200, 'headers': headers, 'body': ''}
            
        # Router
        if path.endswith('/contacts'):
            if method == 'GET':
                # List Contacts (Optional filter by tag)
                tag_filter = (event.get('queryStringParameters') or {}).get('tag')
                return get_contacts(tag_filter, headers)
            elif method == 'POST':
                # Add/Update Contact
                body = json.loads(event.get('body'))
                return upsert_contact(body, headers)
                
        elif path.endswith('/contacts/tags'):
            if method == 'GET':
                return get_tags(headers)
            elif method == 'POST':
                body_str = event.get('body')
                if not body_str:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing request body'})}
                body = json.loads(body_str)
                return create_tag(body, headers)
            elif method == 'DELETE':
                body_str = event.get('body')
                if not body_str:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing request body'})}
                body = json.loads(body_str)
                return delete_tag(body, headers)
                
        elif path.endswith('/contacts/validate'):
            if method == 'POST':
                body_str = event.get('body')
                if not body_str:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing request body'})}
                body = json.loads(body_str)
                return validate_batch(body, headers)
        
        elif path.endswith('/contacts/batch'):
            if method == 'POST':
                body_str = event.get('body')
                if not body_str:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing request body'})}
                body = json.loads(body_str)
                return batch_write(body, headers)

        elif path.endswith('/contacts/delete'):
             if method == 'POST':
                body_str = event.get('body')
                if not body_str:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing request body'})}
                body = json.loads(body_str)
                return delete_contact(body, headers)

        elif path.endswith('/contacts/verify-email'):
            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                email = body.get('email')
                if not email:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Email required'})}
                return verify_email_dns(email, headers)

        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Not Found'})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def verify_email_dns(email, headers):
    import socket
    import re
    
    # 1. Regex Validation
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
         return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'valid': False, 'reason': 'Invalid format'})}
    
    domain = email.split('@')[1]
    
    # 2. Domain Check (using socket)
    # Lambda usually prevents raw socket (port 25) but allowing DNS resolution (port 53 UDP/TCP) via system resolver.
    try:
        # gethostbyname checks for A record. Most active email domains have an A record.
        # This confirms the domain exists.
        socket.gethostbyname(domain)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'valid': True, 'reason': 'Domain verified'})}
    except socket.gaierror:
        # Domain resolution failed
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'valid': False, 'reason': 'Domain does not exist'})}
    except Exception as e:
        print(f"DNS Check Failed: {e}")
        # Fallback to allow if we can't verify, or block? 
        # Safer to say "Unable to verify" but for this logic we return valid=False to be safe?
        # Or maybe assume valid if check fails?
        # Let's return invalid with specific reason
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'valid': False, 'reason': 'Validation Error'})}

def get_contacts(tag_filter, headers):
    try:
        if tag_filter:
            # tailored scan for tags containing the filter
            # Note: For production with millions of rows, we'd need a GSI. 
            # For now, Scan is acceptable for < 10k items.
            response = contacts_table.scan(
                FilterExpression=Attr('tags').contains(tag_filter)
            )
        else:
            response = contacts_table.scan()
        
        # Convert DynamoDB Sets to lists for JSON serialization
        items = response.get('Items', [])
        for item in items:
            if 'tags' in item and isinstance(item['tags'], set):
                item['tags'] = list(item['tags'])
            
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'contacts': items}, default=str)
        }
    except Exception as e:
        raise e

def upsert_contact(data, headers):
    # data: { email, firstName, lastName, company, tags: [] }
    email = data.get('email')
    if not email:
        raise ValueError("Email is required")
        
    # Standardize email
    email = email.lower().strip()
    
    # Prepare Item
    item = {
        'email': email,
        'firstName': data.get('firstName', ''),
        'lastName': data.get('lastName', ''),
        'company': data.get('company', ''),
        'lastUpdated': datetime.datetime.utcnow().isoformat(),
        'source': data.get('source', 'Manual')
    }
    
    # Handle Tags (Set)
    tags = data.get('tags', [])
    if tags:
        item['tags'] = set(tags) # DynamoDB Sets
        
    # Put Item (Upsert)
    contacts_table.put_item(Item=item)
    
    # If tags exist, update tag counts (simplified logic for now)
    # Ideally checking if tag exists first.
    
    # Convert set back to list for JSON response
    if 'tags' in item:
        item['tags'] = list(item['tags'])
        
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Contact saved', 'contact': item}, default=str)
    }

def get_tags(headers):
    response = tags_table.scan()
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'tags': response.get('Items', [])}, default=str)
    }

def create_tag(data, headers):
    tag_name = data.get('tagName')
    if not tag_name:
        raise ValueError("TagName is required")
        
    item = {
        'tagName': tag_name,
        'color': data.get('color', '#3b82f6'), # Default Blue
        'description': data.get('description', ''),
        'createdAt': datetime.datetime.utcnow().isoformat()
    }
    
    tags_table.put_item(Item=item)
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Tag created', 'tag': item}, default=str)
    }

def delete_tag(data, headers):
    tag_name = data.get('tagName')
    if not tag_name:
        raise ValueError("TagName is required")
        
    tags_table.delete_item(Key={'tagName': tag_name})
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Tag deleted'})
    }

def delete_contact(data, headers):
    email = data.get('email')
    if not email:
        raise ValueError("Email required")
        
    contacts_table.delete_item(Key={'email': email})
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Deleted'})
    }

def validate_batch(data, headers):
    # Input: { emails: ["a@b.com", "c@d.com"] }
    # Output: { results: { "a@b.com": { exists: true, data: {...} } } }
    
    emails = data.get('emails', [])
    results = {}
    
    # DynamoDB BatchGetItem is limited to 100 items (and size limits). 
    # For a robust enterprise solution, we chunk this.
    # For now, simplistic loop (efficient enough for < 500 items/lambda execution, otherwise client should chunk).
    
    # Better approach for checking many items: 
    # If list is small (<100), usage keys. If large, client should chunk calls.
    # We will implement a chunked BatchGetItem loop here.
    
    chunks = [emails[i:i + 100] for i in range(0, len(emails), 100)]
    
    for chunk in chunks:
        keys = [{'email': e} for e in chunk]
        if not keys: continue
        
        response = dynamodb.batch_get_item(
            RequestItems={
                'GlobalContacts': {
                    'Keys': keys,
                    'ProjectionExpression': 'email, firstName, lastName, company, tags'
                }
            }
        )
        
        # Process found items
        found_items = response.get('Responses', {}).get('GlobalContacts', [])
        found_map = {item['email']: item for item in found_items}
        
        # Mark results
        for email in chunk:
            if email in found_map:
                # Convert tags set to list
                if 'tags' in found_map[email]:
                    found_map[email]['tags'] = list(found_map[email]['tags'])
                    
                results[email] = {
                    'exists': True,
                    'data': found_map[email]
                }
            else:
                results[email] = { 'exists': False }

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'results': results}, default=str)
    }

def batch_write(data, headers):
    # Input: { contacts: [ {email, ...}, ... ] }
    # This assumes data is CLEAN and READY (Pre-validated by the Firewall UI).
    
    contacts = data.get('contacts', [])
    if not contacts:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'count': 0})}

    # Write contacts
    saved_count = 0
    try:
        with contacts_table.batch_writer() as batch:
            for contact in contacts:
                # Basic sanitization just in case
                if not contact.get('email'): 
                    continue
                
                # Prepare Item
                item = {
                    'email': contact['email'].lower().strip(),
                    'firstName': contact.get('firstName', ''),
                    'lastName': contact.get('lastName', ''),
                    'company': contact.get('company', ''),
                    'lastUpdated': datetime.datetime.utcnow().isoformat(),
                    'source': contact.get('source', 'Import')
                }
                
                # Handle tags
                if contact.get('tags') and len(contact['tags']) > 0:
                    item['tags'] = set(contact['tags'])
                
                batch.put_item(Item=item)
                saved_count += 1
                
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Batch complete', 'count': saved_count})
        }
    except Exception as e:
        print(f"Error in batch_write: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }


