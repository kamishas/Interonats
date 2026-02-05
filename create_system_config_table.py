import boto3
import sys

def create_system_config_table():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table_name = 'SystemConfig'

    try:
        # Check if table exists
        table = dynamodb.Table(table_name)
        table.load()
        print(f"Table {table_name} already exists.")
        return
    except Exception as e:
        if "ResourceNotFoundException" in str(e):
            print(f"Table {table_name} not found. Creating...")
        else:
            # If load() fails for other reasons, we try to create, or it might error out again.
            # But the most reliable way to check existence without loading is list_tables, 
            # or just try creating and catch ResourceInUseException.
            pass

    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'configId',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'configId',
                    'AttributeType': 'S'
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        print(f"Creating table {table_name}...")
        table.wait_until_exists()
        print(f"Table {table_name} created successfully!")
    except Exception as e:
        if "ResourceInUseException" in str(e):
            print(f"Table {table_name} already exists.")
        else:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_system_config_table()
