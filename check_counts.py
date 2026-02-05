import boto3

def count_items(table_name):
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table(table_name)
    try:
        scan = table.scan(Select='COUNT')
        count = scan['Count']
        print(f"Table '{table_name}': {count} items")
    except Exception as e:
        print(f"Error checking '{table_name}': {e}")

if __name__ == "__main__":
    print("--- VERIFYING CLEANUP ---")
    count_items('Campaigns')
    count_items('CampaignRecipients')
