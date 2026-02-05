import boto3
import json
import psycopg2

def get_ssm_parameter(name):
    ssm = boto3.client('ssm', region_name='us-east-2')
    try:
        response = ssm.get_parameter(Name=name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"Error fetching SSM parameter {name}: {e}")
        return None

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-2')
    try:
        response = client.get_secret_value(SecretId=secret_name)
        if 'SecretString' in response:
            return json.loads(response['SecretString'])
        return None
    except Exception as e:
        print(f"Error fetching secret {secret_name}: {e}")
        return None

def apply_schema():
    print("Fetching parameters...")
    db_host = get_ssm_parameter('/interonproducts/DB_HOST')
    db_name = get_ssm_parameter('/interonproducts/DB_NAME')
    secret_key_name = get_ssm_parameter('/interonproducts/DB_SECRET_MANAGER_KEY')
    
    # Verify Schema Name (Important safety check)
    target_schema = "email_agent" 
    # We ignore the SSM param for schema name here because the user explicitly said "email_agent" 
    # and we want to be hardcoded safe against accidental "onehr" touches.

    print("Fetching credentials...")
    secret = get_secret(secret_key_name)
    username = secret.get('username')
    password = secret.get('password')
    port = secret.get('port', 5432)

    print(f"Connecting to {db_host}...")
    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=username,
            password=password,
            port=port,
            connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # 1. Ensure Schema Exists
        print(f"Ensuring schema '{target_schema}' exists...")
        cur.execute(f"CREATE SCHEMA IF NOT EXISTS {target_schema};")
        
        # 2. Define Tables (from proposed_schema.sql)
        sql_commands = [
            """
            CREATE TABLE IF NOT EXISTS email_agent.contacts (
                contact_id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                company VARCHAR(255),
                tags TEXT[], 
                item_type VARCHAR(50) DEFAULT 'contact',
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS email_agent.campaigns (
                campaign_id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                subject VARCHAR(255),
                status VARCHAR(50),
                category VARCHAR(50),
                body_template TEXT,
                images TEXT[],
                total_recipients INTEGER DEFAULT 0,
                sent_count INTEGER DEFAULT 0,
                failed_count INTEGER DEFAULT 0,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS email_agent.contact_tags (
                tag_name VARCHAR(255) PRIMARY KEY,
                description TEXT,
                color VARCHAR(50),
                created_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS email_agent.campaign_recipients (
                campaign_id VARCHAR(255),
                recipient_email VARCHAR(255),
                recipient_id VARCHAR(255),
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                company VARCHAR(255),
                status VARCHAR(50),
                error_message TEXT,
                added_at BIGINT,
                PRIMARY KEY (campaign_id, recipient_email)
            );
            """
        ]
        
        # 3. Execute Commands
        for command in sql_commands:
            table_name = command.split("email_agent.")[1].split(" ")[0]
            print(f"Creating table email_agent.{table_name}...")
            cur.execute(command)
            
        print("Schema application complete!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Failed to apply schema: {e}")

if __name__ == "__main__":
    apply_schema()
