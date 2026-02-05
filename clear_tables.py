import boto3
import time

def clear_table(table_name):
    print(f"\n--- Processing '{table_name}' ---")
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
    table = dynamodb.Table(table_name)
    
    while True:
        try:
            # Scan with limit
            scan = table.scan(Limit=500)
            items = scan.get('Items', [])
            
            if not items:
                print(f"✅ Table '{table_name}' is empty.")
                break

            print(f"Deleting batch of {len(items)} from '{table_name}'...")
            
            # Get Key Schema dynamically
            key_names = [k['AttributeName'] for k in table.key_schema]
            
            with table.batch_writer() as batch:
                for item in items:
                    # Construct key dict based on schema
                    key = {k: item[k] for k in key_names if k in item}
                    
                    if len(key) != len(key_names):
                        print(f"⚠️ Could not construct full key for item. Needed: {key_names}, Found: {key.keys()}")
                        continue
                        
                    batch.delete_item(Key=key)
            
            time.sleep(1) # cooldown
            
        except Exception as e:
            if "ResourceNotFoundException" in str(e):
                 print(f"ℹ️ Table '{table_name}' missing.")
                 break
            print(f"❌ Error: {e}")
            break

if __name__ == "__main__":
    print("STARTING WIPE...")
    clear_table('Campaigns')
    clear_table('CampaignRecipients')
    clear_table('CampaignStats')
    print("\nDONE.")
