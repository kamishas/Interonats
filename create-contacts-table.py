import boto3

dynamodb = boto3.client('dynamodb', region_name='us-east-2')

print("Creating Contacts DynamoDB table...")

try:
    response = dynamodb.create_table(
        TableName='Contacts',
        KeySchema=[
            {'AttributeName': 'contactId', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'contactId', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'  # On-demand pricing
    )
    
    print("✅ Contacts table created successfully!")
    print(f"Table ARN: {response['TableDescription']['TableArn']}")
    print("\nWaiting for table to become active...")
    
    waiter = dynamodb.get_waiter('table_exists')
    waiter.wait(TableName='Contacts')
    
    print("✅ Contacts table is now active and ready to use!")
    
except dynamodb.exceptions.ResourceInUseException:
    print("⚠️  Contacts table already exists - skipping creation")
    
except Exception as e:
    print(f"❌ Error creating table: {str(e)}")
