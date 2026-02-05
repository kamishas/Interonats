import json
import boto3
from boto3.dynamodb.conditions import Attr, Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
recipients_table = dynamodb.Table('CampaignRecipients')

def lambda_handler(event, context):
    print("Fetching Failed Recipients...")
    
    # Handle CORS Preflight
    if event.get('httpMethod') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'})

    try:
        # Scan for status = 'failed'
        # LIMITATION: Scan is expensive. For production with millions of records, use GSI.
        # For now (User MVP), scan is acceptable.
        response = recipients_table.scan(
            FilterExpression=Attr('status').eq('failed')
        )
        
        items = response.get('Items', [])
        
        # Sort by failedAt (newest first)
        # failedAt is a timestamp string
        items.sort(key=lambda x: str(x.get('failedAt', '0')), reverse=True)
        
        # Limit to top 20
        top_failed = items[:20]
        
        # Format for frontend
        formatted = []
        for item in top_failed:
            formatted.append({
                'recipientName': item.get('name', item.get('email')),
                'email': item.get('email'),
                'count': 1, # Aggregate logic handled by frontend or here? Frontend expects count.
                # Actually frontend expects 'count' of failures per recipient.
                # Let's aggregate here for better UI.
                'lastFailedSubject': 'Campaign Email', # We lack subject in Recipient table, might need fallback
                'lastFailedDate': item.get('failedAt')
            })
            
        # Aggregate by email
        aggregated = {}
        for f in formatted:
            email = f['email']
            if email not in aggregated:
                aggregated[email] = f
            else:
                aggregated[email]['count'] += 1
                # Keep latest date
                if f['lastFailedDate'] > aggregated[email]['lastFailedDate']:
                    aggregated[email]['lastFailedDate'] = f['lastFailedDate']
        
        final_list = list(aggregated.values())
        final_list.sort(key=lambda x: x['count'], reverse=True)
        
        return cors_response(200, {'failedRecipients': final_list[:5]})
        
    except Exception as e:
        print(f"Error: {e}")
        return cors_response(500, {'error': str(e)})

def cors_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        },
        'body': json.dumps(body, default=str)
    }
