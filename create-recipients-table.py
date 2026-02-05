import boto3

dynamodb = boto3.client('dynamodb', region_name='us-east-2')

print("="*80)
print("CREATING CAMPAIGNRECIPIENTS TABLE")
print("="*80)

try:
    response = dynamodb.create_table(
        TableName='CampaignRecipients',
        KeySchema=[
            {
                'AttributeName': 'campaignId',
                'KeyType': 'HASH'  # Partition key
            },
            {
                'AttributeName': 'recipientId',
                'KeyType': 'RANGE'  # Sort key
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'campaignId',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'recipientId',
                'AttributeType': 'S'
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    print("✅ Table created successfully!")
    print(f"Table ARN: {response['TableDescription']['TableArn']}")
    print(f"Table Status: {response['TableDescription']['TableStatus']}")
    print("\nWaiting for table to become ACTIVE...")
    
    # Wait for table to be active
    waiter = dynamodb.get_waiter('table_exists')
    waiter.wait(TableName='CampaignRecipients')
    
    print("✅ Table is now ACTIVE and ready to use!")
    
except dynamodb.exceptions.ResourceInUseException:
    print("⚠️  Table already exists")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print(f"\n{'='*80}")
