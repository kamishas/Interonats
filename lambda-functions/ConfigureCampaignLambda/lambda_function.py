import json
import boto3
import os
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = dynamodb.Table('Campaigns')
s3 = boto3.client('s3', region_name='us-east-2')
BUCKET_NAME = "interon-email-images"

def lambda_handler(event, context):
    """
    Configure campaign content (subject, body, images)
    POST /campaigns/{campaignId}/config
    """
    
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return cors_response(200, {'message': 'OK'}, event)
    
    try:
        # Get campaign ID from path
        campaign_id = event.get('pathParameters', {}).get('campaignId')
        if not campaign_id:
            return cors_response(400, {'error': 'Campaign ID is required'}, event)
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        subject = body.get('subject', '')
        body_template = body.get('bodyTemplate', '')
        images = body.get('images', [])
        
        print(f"Configuring campaign {campaign_id}")
        print(f"Subject: {subject}")
        print(f"Body length: {len(body_template)}")
        print(f"Images: {len(images)}")
        
        # PROCESS IMAGES: Copy to approved/{campaignId}/
        processed_images = []
        for img in images:
            try:
                # Robustly resolve image identifier (URL, Key, or Filename)
                img_url = img.get('url') or img.get('s3Key') or img.get('filename') or ''
                # Parse key from URL (e.g. https://.../temp/file.jpg -> temp/file.jpg)
                # Handle both full URL and just key if provided
                if img_url.startswith('http'):
                    from urllib.parse import urlparse
                    parsed = urlparse(img_url)
                    source_key = parsed.path.lstrip('/')
                else:
                    # If it looks like a simple filename, check potential locations
                    if '/' not in img_url and img_url:
                        # Fallback search order: temp -> approved/default
                        candidates = [f"temp/{img_url}", f"approved/default/{img_url}"]
                        source_key = f"temp/{img_url}" # Default
                        
                        for cand in candidates:
                            try:
                                s3.head_object(Bucket=BUCKET_NAME, Key=cand)
                                source_key = cand
                                print(f"Found image at: {source_key}")
                                break
                            except Exception:
                                continue
                    else:
                        source_key = img_url

                filename = os.path.basename(source_key)
                dest_key = f"approved/{campaign_id}/{filename}"
                
                # Check if we need to copy (if not already in destination)
                if source_key != dest_key:
                    print(f"Promoting image: {source_key} -> {dest_key}")
                    
                    try:
                        s3.copy_object(
                            Bucket=BUCKET_NAME,
                            CopySource={'Bucket': BUCKET_NAME, 'Key': source_key},
                            Key=dest_key
                        )
                        print(f"✅ Copied {filename}")
                        
                        # Update URL to new location
                        img['url'] = f"https://{BUCKET_NAME}.s3.us-east-2.amazonaws.com/{dest_key}"
                        img['key'] = dest_key
                        processed_images.append(img)
                        
                    except s3.exceptions.ClientError as e:
                        print(f"⚠️ Copy failed for {source_key}: {str(e)}")
                        # If copy fails, maybe it doesn't exist? Keep original but log.
                        processed_images.append(img)
                else:
                    print(f"Image already in place: {source_key}")
                    processed_images.append(img)

            except Exception as e:
                print(f"Error processing image {img}: {str(e)}")
                processed_images.append(img)

        # Update campaign in DynamoDB
        update_expression = "SET #subject = :subject, #body = :body, #images = :images, #updatedAt = :updatedAt"
        expression_attribute_names = {
            '#subject': 'subject',
            '#body': 'bodyTemplate',
            '#images': 'images',
            '#updatedAt': 'updatedAt'
        }
        expression_attribute_values = {
            ':subject': subject,
            ':body': body_template,
            ':images': processed_images,  # Save the processed list
            ':updatedAt': datetime.now().isoformat()
        }
        
        campaigns_table.update_item(
            Key={'campaignId': campaign_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        print(f"✅ Campaign {campaign_id} configured successfully")
        
        return cors_response(200, {
            'message': 'Campaign configured successfully',
            'campaignId': campaign_id,
            'subject': subject,
            'imagesCount': len(processed_images)
        }, event)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return cors_response(500, {'error': str(e)}, event)


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
