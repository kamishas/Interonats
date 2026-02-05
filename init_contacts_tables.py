import boto3
import time

dynamodb = boto3.client('dynamodb', region_name='us-east-2')

def create_table(name, pk):
    try:
        print(f"Creating table {name}...")
        dynamodb.create_table(
            TableName=name,
            KeySchema=[{'AttributeName': pk, 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': pk, 'AttributeType': 'S'}],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print(f"Table {name} creation initiated.")
        wait_for_active(name)
    except dynamodb.exceptions.ResourceInUseException:
        print(f"Table {name} already exists.")

def wait_for_active(name):
    print(f"Waiting for {name} to be ACTIVE...")
    while True:
        resp = dynamodb.describe_table(TableName=name)
        status = resp['Table']['TableStatus']
        if status == 'ACTIVE':
            print(f"Table {name} is ACTIVE.")
            break
        time.sleep(2)

if __name__ == '__main__':
    create_table('GlobalContacts', 'email')
    create_table('ContactTags', 'tagName')
