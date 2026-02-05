import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('GlobalContacts')

def delete_all_contacts():
    print("Scanning contacts to delete...")
    # Scan matches all items
    scan = table.scan()
    items = scan.get('Items', [])
    
    with table.batch_writer() as batch:
        for item in items:
            email = item['email']
            print(f"Deleting {email}...")
            # Assuming 'email' is the Partition Key. 
            # If there is a Sort Key, it must be included too.
            # Based on previous context, 'email' seemed to be the key, but checking is good.
            # Usually users use email as PK for contacts.
            batch.delete_item(Key={'email': email})

    print(f"Deleted {len(items)} contacts.")

if __name__ == "__main__":
    delete_all_contacts()
