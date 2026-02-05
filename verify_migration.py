import boto3
import json
import psycopg2

REGION = 'us-east-2'

def get_ssm_parameter(name):
    ssm = boto3.client('ssm', region_name=REGION)
    try:
        response = ssm.get_parameter(Name=name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"Error fetching SSM parameter {name}: {e}")
        return None

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name=REGION)
    try:
        response = client.get_secret_value(SecretId=secret_name)
        if 'SecretString' in response:
            return json.loads(response['SecretString'])
        return None
    except Exception as e:
        print(f"Error fetching secret {secret_name}: {e}")
        return None

def verify_migration():
    print("Verifying Migration...")
    
    # 1. DynamoDB Counts
    dynamo = boto3.resource('dynamodb', region_name=REGION)
    tables = ['Contacts', 'Campaigns', 'ContactTags', 'CampaignRecipients']
    dynamo_counts = {}
    
    print("\nDynamoDB Counts:")
    for t in tables:
        table = dynamo.Table(t)
        # Scan count is more accurate than ItemCount metadata for small tables
        count = table.scan(Select='COUNT')['Count']
        dynamo_counts[t] = count
        print(f" - {t}: {count}")
    
    # 2. Postgres Counts
    db_host = get_ssm_parameter('/interonproducts/DB_HOST')
    db_name = get_ssm_parameter('/interonproducts/DB_NAME')
    secret_key_name = get_ssm_parameter('/interonproducts/DB_SECRET_MANAGER_KEY')
    secret = get_secret(secret_key_name)
    
    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=secret.get('username'),
            password=secret.get('password'),
            port=secret.get('port', 5432)
        )
        cur = conn.cursor()
        
        pg_counts = {}
        pg_tables = {
            'Contacts': 'email_agent.contacts',
            'Campaigns': 'email_agent.campaigns',
            'ContactTags': 'email_agent.contact_tags',
            'CampaignRecipients': 'email_agent.campaign_recipients'
        }
        
        print("\nPostgres Counts:")
        for name, pg_name in pg_tables.items():
            cur.execute(f"SELECT COUNT(*) FROM {pg_name};")
            count = cur.fetchone()[0]
            pg_counts[name] = count
            print(f" - {name} ({pg_name}): {count}")
            
        cur.close()
        conn.close()
        
        # 3. Comparison
        print("\n--- Verification Results ---")
        all_match = True
        for name in tables:
            d_count = dynamo_counts.get(name, 0)
            p_count = pg_counts.get(name, 0)
            
            # Special logic for Contacts: filtering might reduce count
            if name == 'Contacts':
                print(f"{name}: Dynamo={d_count} vs Postgres={p_count}")
                # We expect Postgres <= Dynamo because we filtered by 'email'
            else:
                if d_count == p_count:
                    print(f"✅ {name}: Match ({d_count})")
                else:
                    print(f"❌ {name}: Mismatch! (Dynamo: {d_count}, Postgres: {p_count})")
                    all_match = False

    except Exception as e:
        print(f"Verification Failed: {e}")

if __name__ == "__main__":
    verify_migration()
