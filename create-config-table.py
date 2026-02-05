import boto3

def create_config_table():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table_name = 'SystemConfig'
    
    try:
        # Check if exists
        table = dynamodb.Table(table_name)
        table.load()
        print(f"Table {table_name} already exists.")
        return
    except:
        print(f"Creating table {table_name}...")
        
    table = dynamodb.create_table(
        TableName=table_name,
        KeySchema=[
            {'AttributeName': 'configId', 'KeyType': 'HASH'}  # Partition Key
        ],
        AttributeDefinitions=[
            {'AttributeName': 'configId', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    table.wait_until_exists()
    print(f"Table {table_name} created successfully.")

if __name__ == '__main__':
    create_config_table()
