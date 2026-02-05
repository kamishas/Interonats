import boto3
import json
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')

# Store tags in Contacts table as a special item type
# Or create a separate ContactTags table
# For now, let's use a simple approach: store in Contacts table with a special contactId
contacts_table = dynamodb.Table('Contacts')

def lambda_handler(event, context):
    """
    Create a new tag and persist it to DynamoDB
    
    POST /contacts/tags
    Body: {"tagName": "...", "color": "..."}
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        tag_name = body.get('tagName', '').strip()
        tag_color = body.get('color', '#3b82f6')
        
        if not tag_name:
            return cors_response(400, {'error': 'Tag name is required'}, event)
        
        print(f"Creating tag: {tag_name} with color: {tag_color}")
        
        # Store tag in DynamoDB
        # Use a special contactId format for tags: "tag_{tagName}"
        tag_id = f"tag_{tag_name.lower().replace(' ', '_')}"
        
        tag_item = {
            'contactId': tag_id,
            'tagName': tag_name,
            'color': tag_color,
            'description': body.get('description', ''),
            'createdAt': datetime.now().isoformat(),
            'itemType': 'tag'  # Mark this as a tag item
        }
        
        # Save to DynamoDB
        contacts_table.put_item(Item=tag_item)
        
        print(f"✅ Tag saved to DynamoDB: {tag_id}")
        
        # Return the tag data
        tag_data = {
            'tagName': tag_name,
            'color': tag_color,
            'description': tag_item['description']
        }
        
        return cors_response(200, tag_data, event)
    
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
