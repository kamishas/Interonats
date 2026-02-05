import boto3

# Check for actual campaigns
ddb = boto3.resource('dynamodb', region_name='us-east-2')
campaigns_table = ddb.Table('Campaigns')

print("="*60)
print("CHECKING FOR REAL CAMPAIGNS")
print("="*60)

response = campaigns_table.scan(Limit=10)
campaigns = response.get('Items', [])

if campaigns:
    print(f"\nFound {len(campaigns)} campaigns:")
    for campaign in campaigns:
        campaign_id = campaign.get('campaignId')
        subject = campaign.get('subject', 'No subject')
        status = campaign.get('status', 'unknown')
        print(f"\n  Campaign ID: {campaign_id}")
        print(f"  Subject: {subject}")
        print(f"  Status: {status}")
        
        # Check recipients
        recipients_table = ddb.Table('CampaignRecipients')
        recip_response = recipients_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('campaignId').eq(campaign_id)
        )
        recipients = recip_response.get('Items', [])
        print(f"  Recipients: {len(recipients)}")
        
        if recipients:
            for r in recipients[:2]:
                print(f"    - {r.get('email')} ({r.get('status', 'pending')})")
else:
    print("\n❌ No campaigns found in database")

print("\n" + "="*60)
