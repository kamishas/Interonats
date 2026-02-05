import json
import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
CAMPAIGNS_TABLE = os.environ.get('CAMPAIGNS_TABLE', 'Campaigns')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    try:
        table = dynamodb.Table(CAMPAIGNS_TABLE)
        
        # Scan the table to get all campaigns
        # In a real production app with many items, we should use Query with an index or pagination
        response = table.scan()
        items = response.get('Items', [])
        
        # Sort by createdAt desc
        items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Aggregate stats from Recipients table
        recipients_table = dynamodb.Table(os.environ.get('RECIPIENTS_TABLE', 'CampaignRecipients'))
        
        for campaign in items:
            campaign_id = campaign.get('campaignId')
            if not campaign_id: continue
            
            try:
                # Query all recipients for this campaign
                # Note: For large lists, this might need pagination, but for now it's fine
                r_resp = recipients_table.query(
                    KeyConditionExpression=Key('campaignId').eq(campaign_id)
                )
                recipients = r_resp.get('Items', [])
                
                total = len(recipients)
                sent = sum(1 for r in recipients if r.get('status') == 'sent')
                failed = sum(1 for r in recipients if r.get('status') == 'failed')
                
                campaign['totalRecipients'] = total
                campaign['sentCount'] = sent
                campaign['failedCount'] = failed
                
                # Attach recipients list for frontend Launchpad view
                campaign['recipients'] = recipients 
                
            except Exception as e:
                print(f"Error fetching recipients for {campaign_id}: {str(e)}")
                campaign['totalRecipients'] = 0
                campaign['sentCount'] = 0
                campaign['failedCount'] = 0
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps({'campaigns': items}, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps({'error': str(e)})
        }
