import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
contacts_table = dynamodb.Table('Contacts')

def lambda_handler(event, context):
    """
    List all unique tags from contacts
    
    GET /contacts/tags
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight request
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        # Scan for tag items in Contacts table
        # Tags are stored with itemType='tag'
        response = contacts_table.scan(
            FilterExpression='itemType = :type',
            ExpressionAttributeValues={':type': 'tag'}
        )
        
        tags_items = response.get('Items', [])
        
        # Extract tag data
        tags_list = []
        for item in tags_items:
            tags_list.append({
                'tagName': item.get('tagName', ''),
                'color': item.get('color', '#3b82f6'),
                'description': item.get('description', '')
            })
        
        # Sort by tagName
        tags_list.sort(key=lambda x: x.get('tagName', '').lower())
        
        print(f"Found {len(tags_list)} tags")
        
        return cors_response(200, {
            'tags': tags_list,
            'count': len(tags_list)
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
        'statusCode': 200,
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


def decimal_default(obj):
    """Convert Decimal to int/float for JSON serialization"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError
