import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
contacts_table = dynamodb.Table('Contacts')

def lambda_handler(event, context):
    """
    Delete a contact
    
    DELETE /contacts/{contactId}
    """
    
    print(f"Event: {json.dumps(event)}")
    
    try:
        path_params = event.get('pathParameters', {})
        contact_id = path_params.get('contactId')
        
        if not contact_id:
            return error_response(400, 'contactId is required')
        
        # Delete from DynamoDB
        contacts_table.delete_item(
            Key={'contactId': contact_id}
        )
        
        print(f"Deleted contact: {contact_id}")
        
        return success_response({
            'message': 'Contact deleted successfully',
            'contactId': contact_id
        })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(500, f'Internal server error: {str(e)}')


def success_response(data):
    """Return successful response with CORS headers"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data)
    }


def error_response(status_code, message):
    """Return error response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'error': message})
    }
