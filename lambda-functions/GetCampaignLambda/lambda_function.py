import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')
recipients_table = dynamodb.Table('CampaignRecipients')

def lambda_handler(event, context):
    """
    Get complete campaign data including recipients and images
    
    GET /campaigns/{campaignId}
    """
    
    print(f"Event: {json.dumps(event)}")
    
    
    # Handle OPTIONS preflight (CORS)
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'CORS OK'})
        }

    path_params = event.get('pathParameters', {})
    campaign_id = path_params.get('campaignId')
    
    if not campaign_id:
        return error_response(400, 'campaignId is required')
    
    try:
        return get_campaign(campaign_id)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(500, f'Internal server error: {str(e)}')


def get_campaign(campaign_id):
    """Fetch campaign with all related data"""
    
    # Get campaign from Campaigns table
    campaign_response = campaigns_table.get_item(
        Key={'campaignId': campaign_id}
    )
    
    if 'Item' not in campaign_response:
        return error_response(404, f'Campaign {campaign_id} not found')
    
    campaign = campaign_response['Item']
    
    # Get all recipients for this campaign
    recipients_response = recipients_table.query(
        KeyConditionExpression='campaignId = :cid',
        ExpressionAttributeValues={':cid': campaign_id}
    )
    
    recipients = recipients_response.get('Items', [])
    
    # Add recipients to campaign
    campaign['recipients'] = recipients
    
    # Calculate counts
    campaign['totalRecipients'] = len(recipients)
    campaign['sentCount'] = sum(1 for r in recipients if r.get('status') == 'sent')
    campaign['failedCount'] = sum(1 for r in recipients if r.get('status') == 'failed')
    
    # Ensure images field exists
    if 'images' not in campaign:
        campaign['images'] = []
    
    # Map backend field names to frontend expectations
    if 'bodyTemplate' in campaign and 'body' not in campaign:
        campaign['body'] = campaign['bodyTemplate']
    
    # Convert Decimal to int/float for JSON serialization
    campaign = json.loads(json.dumps(campaign, default=decimal_default))
    
    print(f"Retrieved campaign {campaign_id} with {len(recipients)} recipients")
    
    return success_response(campaign)


def success_response(data):
    """Return successful response with CORS headers"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
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
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'error': message})
    }


def decimal_default(obj):
    """Convert Decimal to int/float for JSON serialization"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError
