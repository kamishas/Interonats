import boto3
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')

def lambda_handler(event, context):
    """
    Create a new campaign
    
    POST /campaigns
    Body: { "name": "Campaign Name" }
    """
    
    print(f"Event: {json.dumps(event)}")
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        if not body.get('name'):
            return error_response(400, 'Campaign name is required')
        
        # Generate unique campaign ID
        campaign_id = str(int(datetime.now().timestamp() * 1000))
        
        # Create campaign item
        campaign = {
            'campaignId': campaign_id,
            'name': body['name'],
            'status': 'draft',
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat(),
            'subject': '',
            'bodyTemplate': '',
            'images': [],
            'totalRecipients': 0,
            'sentCount': 0,
            'failedCount': 0
        }
        
        # Save to DynamoDB
        campaigns_table.put_item(Item=campaign)
        
        print(f"Created campaign: {campaign_id}")
        
        # Return campaign with frontend-expected fields
        response_campaign = {
            **campaign,
            'id': campaign_id,
            'body': campaign['bodyTemplate'],
            'recipients': []
        }
        
        return success_response(response_campaign)
    
    except Exception as e:
        print(f"Error: {str(e)}")
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
