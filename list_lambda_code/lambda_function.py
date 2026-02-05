import boto3
import json
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')

def lambda_handler(event, context):
    """
    List all campaigns with dynamic CORS support
    
    GET /campaigns
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight request
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    campaign_id = None
    if event.get('pathParameters') and event.get('pathParameters').get('campaignId'):
        campaign_id = event['pathParameters']['campaignId']
    
    try:
        if campaign_id:
            # === GET SINGLE CAMPAIGN DETAILS ===
            campaign_response = campaigns_table.get_item(Key={'campaignId': campaign_id})
            campaign = campaign_response.get('Item')
            
            if not campaign:
                return cors_response(404, {'error': 'Campaign not found'}, event)
            
            # Fetch recipients
            recipients_table = dynamodb.Table('CampaignRecipients')
            recipients_response = recipients_table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key('campaignId').eq(campaign_id)
            )
            recipients = recipients_response.get('Items', [])
            
            # Calculate stats
            total = len(recipients)
            sent = sum(1 for r in recipients if r.get('status') == 'Sent')
            delivered = sum(1 for r in recipients if r.get('status') == 'Delivered')
            failed = sum(1 for r in recipients if r.get('status') == 'Failed')
            
            # Map recipients for frontend
            mapped_recipients = []
            for r in recipients:
                mapped_recipients.append({
                    'id': r.get('recipientId'),
                    'email': r.get('email'),
                    'name': f"{r.get('firstName', '')} {r.get('lastName', '')}".strip() or r.get('email'),
                    'status': r.get('status', 'Pending'),
                    'company': r.get('company', '')
                })
            
            # Construct detailed response
            detail = {
                'id': campaign.get('campaignId'),
                'campaignId': campaign.get('campaignId'),
                'name': campaign.get('name', campaign.get('subject', 'Untitled Campaign')),
                'subject': campaign.get('subject', ''),
                'body': campaign.get('body') or campaign.get('bodyTemplate', ''),
                'status': campaign.get('status', 'draft'),
                'createdAt': campaign.get('createdAt'),
                'sentAt': campaign.get('sentAt'),
                'category': campaign.get('category', 'General'),
                'recipients': mapped_recipients,  # The key part the frontend needs
                'stats': {
                    'total': total,
                    'sent': sent,
                    'delivered': delivered,
                    'failed': failed
                }
            }
            
            return cors_response(200, detail, event)
            
        else:
            # === LIST ALL CAMPAIGNS (Original Logic) ===
            response = campaigns_table.scan()
            campaigns = response.get('Items', [])
            
            # Map backend fields to frontend expectations
            mapped_campaigns = []
            for campaign in campaigns:
                mapped = {
                    'id': campaign.get('campaignId'),
                    'campaignId': campaign.get('campaignId'),
                    'name': campaign.get('name', campaign.get('subject', 'Untitled Campaign')),
                    'subject': campaign.get('subject', ''),
                    'body': campaign.get('body') or campaign.get('bodyTemplate', ''),
                    'bodyTemplate': campaign.get('bodyTemplate', ''),
                    'status': campaign.get('status', 'draft'),
                    'createdAt': campaign.get('createdAt', datetime.now().isoformat()),
                    'images': campaign.get('images', []),
                    'totalRecipients': campaign.get('totalRecipients', 0),
                    'sentCount': campaign.get('sentCount', 0),
                    'failedCount': campaign.get('failedCount', 0),
                    'category': campaign.get('category', 'General')
                }
                mapped_campaigns.append(mapped)
            
            # Sort by creation date (newest first)
            mapped_campaigns.sort(key=lambda x: str(x.get('createdAt', '')), reverse=True)
            
            # Convert Decimal to int/float for JSON
            campaigns_json = json.loads(json.dumps(mapped_campaigns, default=decimal_default))
            
            return cors_response(200, {
                'campaigns': campaigns_json,
                'count': len(campaigns_json)
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
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept,Origin',
            'Access-Control-Allow-Credentials': 'true',
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
