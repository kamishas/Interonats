import json
import boto3
import uuid
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
recipients_table = dynamodb.Table('CampaignRecipients')

def lambda_handler(event, context):
    """
    Manage recipients (GET and POST)
    """
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight
    # Support both HTTP API (v2) and REST API (v1) structures
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
    if http_method == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        campaign_id = event.get('pathParameters', {}).get('campaignId')
        if not campaign_id:
            return cors_response(400, {'error': 'Campaign ID is required'}, event)
            
        # ------------------------------------------------------------------
        # HANDLE SPECIAL REPORT: Failed Recipients
        # ------------------------------------------------------------------
        if campaign_id == 'report-failed':
            return handle_failed_report()
            
        # ------------------------------------------------------------------
        # HANDLE POST: Save Recipients
        # ------------------------------------------------------------------
        if http_method == 'POST':
            print(f"Saving recipients for campaign {campaign_id}")
            body = json.loads(event.get('body', '{}'))
            recipients = body.get('recipients', [])
            
            if not recipients:
                print("No recipients provided in body")
                return cors_response(200, {'message': 'No recipients to save'}, event)
            
            print(f"Preparing to save {len(recipients)} recipients")
            
            # Use batch writer for efficiency
            with recipients_table.batch_writer() as batch:
                for r in recipients:
                    # Create item
                    item = {
                        'campaignId': campaign_id,
                        'recipientId': r.get('id') or str(uuid.uuid4()),
                        'email': r.get('email'),
                        'firstName': r.get('firstName', ''),
                        'lastName': r.get('lastName', ''),
                        'company': r.get('company', ''),
                        'status': r.get('status', 'pending'),
                        'addedAt': str(int(time.time()))
                    }
                    batch.put_item(Item=item)
            
            print("✅ Recipients saved successfully")
            
            # --- Update Campaign Total Recipients Count ---
            try:
                # Re-query to get accurate total count
                total_resp = recipients_table.query(
                    KeyConditionExpression='campaignId = :cid',
                    ExpressionAttributeValues={':cid': campaign_id},
                    Select='COUNT' # Only need count
                )
                total_count = total_resp['Count']
                
                campaigns_table = dynamodb.Table('Campaigns')
                campaigns_table.update_item(
                    Key={'campaignId': campaign_id},
                    UpdateExpression="SET totalRecipients = :t",
                    ExpressionAttributeValues={':t': total_count}
                )
                print(f"Updated totalRecipients to {total_count}")
                
            except Exception as update_err:
                 print(f"Warning: Failed to update totalRecipients: {update_err}")

            return cors_response(200, {'message': 'Recipients saved', 'count': len(recipients)}, event)

        # ------------------------------------------------------------------
        # HANDLE GET: Fetch Recipients
        # ------------------------------------------------------------------
        elif http_method == 'GET':
            print(f"Fetching recipients for campaign {campaign_id}")
            
            response = recipients_table.query(
                KeyConditionExpression='campaignId = :cid',
                ExpressionAttributeValues={':cid': campaign_id}
            )
            
            recipients = response.get('Items', [])
            
            # Clean up for JSON
            recipients_clean = []
            for r in recipients:
                recipients_clean.append({
                    'id': r.get('recipientId'),
                    'email': r.get('email'),
                    'firstName': r.get('firstName', ''),
                    'lastName': r.get('lastName', ''),
                    'company': r.get('company', ''),
                    'status': r.get('status', 'pending')
                    # 'addedAt' is internal, no need to return unless needed
                })
            
            print(f"✅ Found {len(recipients_clean)} recipients")
            return cors_response(200, {
                'recipients': recipients_clean,
                'count': len(recipients_clean)
            }, event)
            
        else:
             return cors_response(405, {'error': f'Method {http_method} not allowed'}, event)

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return cors_response(500, {'error': str(e)}, event)

import time

def handle_failed_report():
    print("Generating Failed Recipients Report...")
    from boto3.dynamodb.conditions import Attr
    
    try:
        # Scan for status = 'failed'
        response = recipients_table.scan(
            FilterExpression=Attr('status').eq('failed')
        )
        
        items = response.get('Items', [])
        
        # Sort by failedAt (newest first)
        items.sort(key=lambda x: str(x.get('failedAt', '0')), reverse=True)
        
        # Aggregate by email
        aggregated = {}
        for item in items:
            email = item.get('email')
            if not email:
                continue
                
            if email not in aggregated:
                aggregated[email] = {
                    'recipientName': item.get('name', item.get('firstName', '') + ' ' + item.get('lastName', '')).strip() or email,
                    'email': email,
                    'count': 0,
                    'lastFailedDate': '0',
                    'lastFailedSubject': 'Campaign Email'
                }
            
            aggregated[email]['count'] += 1
            
            # Keep latest date
            fa = item.get('failedAt', '0')
            if fa > aggregated[email]['lastFailedDate']:
                 aggregated[email]['lastFailedDate'] = fa
        
        # Convert to list and sort by count desc
        final_list = list(aggregated.values())
        final_list.sort(key=lambda x: x['count'], reverse=True)
        
        top_5 = final_list[:5]
        
        print(f"Found {len(final_list)} failed recipients, returning top {len(top_5)}")
        
        return cors_response(200, {'failedRecipients': top_5}, {})
        
    except Exception as e:
        print(f"Error generating report: {e}")
        return cors_response(500, {'error': str(e)}, {})

def cors_response(status_code, data, event):
    """Return response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data, default=str)
    }
