import boto3
import json
import psycopg2
from psycopg2.extras import execute_values
from decimal import Decimal
import datetime

# --- Configuration ---
REGION = 'us-east-2'
TARGET_SCHEMA = 'email_agent'

# --- Helpers ---
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

def get_db_connection():
    db_host = get_ssm_parameter('/interonproducts/DB_HOST')
    db_name = get_ssm_parameter('/interonproducts/DB_NAME')
    secret_key_name = get_ssm_parameter('/interonproducts/DB_SECRET_MANAGER_KEY')
    
    secret = get_secret(secret_key_name)
    username = secret.get('username')
    password = secret.get('password')
    port = secret.get('port', 5432)
    
    conn = psycopg2.connect(
        host=db_host,
        database=db_name,
        user=username,
        password=password,
        port=port
    )
    return conn

def scan_dynamodb_table(table_name):
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(table_name)
    
    items = []
    response = table.scan()
    items.extend(response.get('Items', []))
    
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))
        
    return items

# --- Migration Functions ---

def migrate_contacts(conn):
    print("Migrating Contacts...")
    items = scan_dynamodb_table('Contacts')
    
    # Filter for actual contacts (based on 'email' presence or itemType)
    contacts = [i for i in items if 'email' in i] # Simple filter
    
    if not contacts:
        print("No contacts found.")
        return

    data = []
    for item in contacts:
        tags = item.get('tags', [])
        if isinstance(tags, list):
             # Ensure all tags are strings
             tags = [str(t) for t in tags]
        
        data.append((
            item.get('contactId'),
            item.get('email'),
            item.get('firstName'),
            item.get('lastName'),
            item.get('company'),
            tags,
            item.get('itemType', 'contact'),
            item.get('createdAt'),
            item.get('updatedAt')
        ))
    
    query = f"""
        INSERT INTO {TARGET_SCHEMA}.contacts 
        (contact_id, email, first_name, last_name, company, tags, item_type, created_at, updated_at)
        VALUES %s
        ON CONFLICT (contact_id) DO NOTHING;
    """
    
    with conn.cursor() as cur:
        execute_values(cur, query, data)
    print(f"Migrated {len(data)} contacts.")

def migrate_campaigns(conn):
    print("Migrating Campaigns...")
    items = scan_dynamodb_table('Campaigns')
    
    data = []
    for item in items:
        # Decimal to int conversion
        total_recipients = int(item.get('totalRecipients', 0))
        sent_count = int(item.get('sentCount', 0))
        failed_count = int(item.get('failedCount', 0))
        images = item.get('images', [])

        data.append((
            item.get('campaignId'),
            item.get('name'),
            item.get('subject'),
            item.get('status'),
            item.get('category'),
            item.get('bodyTemplate'),
            images,
            total_recipients,
            sent_count,
            failed_count,
            item.get('createdAt'),
            item.get('updatedAt')
        ))

    if not data:
        print("No campaigns found.")
        return

    query = f"""
        INSERT INTO {TARGET_SCHEMA}.campaigns
        (campaign_id, name, subject, status, category, body_template, images, total_recipients, sent_count, failed_count, created_at, updated_at)
        VALUES %s
        ON CONFLICT (campaign_id) DO NOTHING;
    """
    
    with conn.cursor() as cur:
        execute_values(cur, query, data)
    print(f"Migrated {len(data)} campaigns.")

def migrate_contact_tags(conn):
    print("Migrating ContactTags...")
    items = scan_dynamodb_table('ContactTags')
    
    data = []
    for item in items:
        data.append((
            item.get('tagName'),
            item.get('description'),
            item.get('color'),
            item.get('createdAt')
        ))

    if not data:
        print("No contact tags found.")
        return

    query = f"""
        INSERT INTO {TARGET_SCHEMA}.contact_tags
        (tag_name, description, color, created_at)
        VALUES %s
        ON CONFLICT (tag_name) DO NOTHING;
    """
    
    with conn.cursor() as cur:
        execute_values(cur, query, data)
    print(f"Migrated {len(data)} tags.")

def migrate_recipients(conn):
    print("Migrating CampaignRecipients...")
    items = scan_dynamodb_table('CampaignRecipients')
    
    data = []
    for item in items:
        # addedAt is string unix timestamp in source
        added_at = int(item.get('addedAt', 0)) if item.get('addedAt') else None
        
        data.append((
            item.get('campaignId'),
            item.get('email'), # recipient_email
            item.get('recipientId'),
            item.get('firstName'),
            item.get('lastName'),
            item.get('company'),
            item.get('status'),
            item.get('errorMessage'),
            added_at
        ))

    if not data:
        print("No recipients found.")
        return

    query = f"""
        INSERT INTO {TARGET_SCHEMA}.campaign_recipients
        (campaign_id, recipient_email, recipient_id, first_name, last_name, company, status, error_message, added_at)
        VALUES %s
        ON CONFLICT (campaign_id, recipient_email) DO NOTHING;
    """
    
    with conn.cursor() as cur:
        execute_values(cur, query, data)
    print(f"Migrated {len(data)} recipients.")

def run_migration():
    try:
        conn = get_db_connection()
        conn.autocommit = True
        
        migrate_contacts(conn)
        migrate_campaigns(conn)
        migrate_contact_tags(conn)
        migrate_recipients(conn)
        
        conn.close()
        print("\n--- MIGRATION COMPLETE ---")
        
    except Exception as e:
        print(f"Migration Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_migration()
