import boto3
import json
from decimal import Decimal
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')

def lambda_handler(event, context):
    """
    List all campaigns with dynamic CORS support and real-time stats
    
    GET /campaigns
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight request
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        # Scan all campaigns
        response = campaigns_table.scan()
        
        campaigns = response.get('Items', [])
        
        # Map backend fields to frontend expectations
        mapped_campaigns = []
        for campaign in campaigns:
            c_id = campaign.get('campaignId')
            
            # Dynamic Calc: Fetch real stats from CampaignRecipients
            sent = 0
            delivered = 0
            failed = 0
            total_r = 0
            recipient_details = [] # Initialize before try block to avoid NameError
            
            try:
                recipients_table = dynamodb.Table('CampaignRecipients')
                
                # Query all recipients for this campaign
                # Schema: PK=campaignId
                r_response = recipients_table.query(
                    KeyConditionExpression=Key('campaignId').eq(c_id)
                )
                recipients = r_response.get('Items', [])
                total_r = len(recipients)
                
                for r in recipients:
                    status = (r.get('status') or '').lower()
                    if status == 'sent':
                        sent += 1
                    elif status == 'delivered':
                        delivered += 1
                        sent += 1 # Delivered implies sent
                    elif status == 'failed':
                        failed += 1
                        sent += 1 # Failed implies sent
                    
                    # Add to detailed list
                    recipient_details.append({
                        'email': r.get('email'),
                        'name': r.get('name', r.get('recipientName')),
                        'status': status
                    })
                
            except Exception as e:
                print(f"Error calculating stats for {c_id}: {e}")
                sent = campaign.get('sentCount', 0)
                delivered = campaign.get('deliveredCount', 0)
                failed = campaign.get('failedCount', 0)
            
            mapped = {
                'id': c_id,
                'campaignId': c_id,
                'name': campaign.get('name', campaign.get('subject', 'Untitled Campaign')),
                'subject': campaign.get('subject', ''),
                'body': campaign.get('body') or campaign.get('bodyTemplate', ''),
                'bodyTemplate': campaign.get('bodyTemplate', ''),
                'status': campaign.get('status', 'draft'),
                'createdAt': campaign.get('createdAt', datetime.now().isoformat()),
                'images': campaign.get('images', []),
                'category': campaign.get('category', 'General'),
                'totalRecipients': total_r if total_r > 0 else campaign.get('totalRecipients', 0),
                'sentCount': sent,
                'deliveredCount': delivered,
                'failedCount': failed,
                'recipients': recipient_details # Added recipients list
            }
            mapped_campaigns.append(mapped)
        
        # Sort by creation date (newest first)
        mapped_campaigns.sort(key=lambda x: str(x.get('createdAt', '')), reverse=True)
        
        # Convert Decimal to int/float for JSON
        campaigns_json = json.loads(json.dumps(mapped_campaigns, default=decimal_default))
        
        print(f"Found {len(campaigns_json)} campaigns")
        
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
