import boto3
import json
from decimal import Decimal
from datetime import datetime
import hashlib

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
contacts_table = dynamodb.Table('Contacts')

def lambda_handler(event, context):
    """
    Batch save contacts to DynamoDB
    
    POST /contacts/batch
    Body: {"contacts": [{email, firstName, lastName, company, tags}, ...]}
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        contacts = body.get('contacts', [])
        
        print(f"Batch saving {len(contacts)} contacts")
        
        saved_contacts = []
        failed_contacts = []
        
        for contact in contacts:
            try:
                # Generate contact ID from email
                email = contact.get('email', '').strip().lower()
                if not email:
                    failed_contacts.append({'contact': contact, 'error': 'Missing email'})
                    continue
                
                contact_id = hashlib.md5(email.encode()).hexdigest()
                
                # Prepare contact item
                contact_item = {
                    'contactId': contact_id,
                    'email': email,
                    'firstName': contact.get('firstName', '').strip(),
                    'lastName': contact.get('lastName', '').strip(),
                    'company': contact.get('company', '').strip(),
                    'tags': contact.get('tags', []),
                    'createdAt': datetime.now().isoformat(),
                    'updatedAt': datetime.now().isoformat(),
                    'itemType': 'contact'
                }
                
                # Save to DynamoDB
                contacts_table.put_item(Item=contact_item)
                
                saved_contacts.append({
                    'contactId': contact_id,
                    'email': email,
                    'firstName': contact_item['firstName'],
                    'lastName': contact_item['lastName']
                })
                
            except Exception as e:
                print(f"Error saving contact: {str(e)}")
                failed_contacts.append({'contact': contact, 'error': str(e)})
        
        print(f"✅ Saved: {len(saved_contacts)}, ❌ Failed: {len(failed_contacts)}")
        
        return cors_response(200, {
            'saved': saved_contacts,
            'failed': failed_contacts,
            'savedCount': len(saved_contacts),
            'failedCount': len(failed_contacts)
        }, event)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return cors_response(500, {'error': f'Internal server error: {str(e)}'}, event)


def cors_response(status_code, data, event):
    """Return response with dynamic CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Expose-Headers': '*',
            'Access-Control-Max-Age': '86400',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data, default=str)
    }
