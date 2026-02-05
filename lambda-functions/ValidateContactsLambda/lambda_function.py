import boto3
import json
from decimal import Decimal

def lambda_handler(event, context):
    """
    Validate contacts before import
    
    POST /contacts/validate
    Body: {"contacts": [{email, firstName, lastName, ...}, ...]}
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        contacts = body.get('contacts', [])
        
        print(f"Validating {len(contacts)} contacts")
        
        # Validate each contact
        valid_contacts = []
        invalid_contacts = []
        
        for idx, contact in enumerate(contacts):
            email = contact.get('email', '').strip()
            first_name = contact.get('firstName', '').strip()
            last_name = contact.get('lastName', '').strip()
            
            # Basic validation
            errors = []
            if not email:
                errors.append('Email is required')
            elif '@' not in email:
                errors.append('Invalid email format')
            
            if not first_name:
                errors.append('First name is required')
            
            if not last_name:
                errors.append('Last name is required')
            
            if errors:
                invalid_contacts.append({
                    'row': idx + 1,
                    'contact': contact,
                    'errors': errors
                })
            else:
                valid_contacts.append(contact)
        
        print(f"Valid: {len(valid_contacts)}, Invalid: {len(invalid_contacts)}")
        
        return cors_response(200, {
            'valid': valid_contacts,
            'invalid': invalid_contacts,
            'validCount': len(valid_contacts),
            'invalidCount': len(invalid_contacts)
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
