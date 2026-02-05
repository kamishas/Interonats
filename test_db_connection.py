import boto3
import json
import sys
import os

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

def test_connection():
    print("Fetching parameters...")
    
    # 1. Fetch SSM Parameters
    db_host = get_ssm_parameter('/interonproducts/DB_HOST')
    db_name = get_ssm_parameter('/interonproducts/DB_NAME')
    secret_key_name = get_ssm_parameter('/interonproducts/DB_SECRET_MANAGER_KEY')
    schema_name = get_ssm_parameter('/interonproducts/Schema_Email')  # Might be a parameter key?
    
    # Adjust schema retrieval if the user meant the value is literally "interonproducts/Schema_Email"
    # The user said: "Schema : interonproducts/Schema_Email" which looks like the key.
    
    if not db_host or not db_name or not secret_key_name:
        print("Failed to retrieve essential SSM parameters.")
        return

    print(f"DB Host: {db_host}")
    print(f"DB Name: {db_name}")
    print(f"Secret Key: {secret_key_name}")

    # 2. Fetch Credentials from Secrets Manager
    print("Fetching credentials...")
    secret = get_secret(secret_key_name)
    if not secret:
        print("Failed to retrieve credentials from Secrets Manager.")
        return

    username = secret.get('username')
    password = secret.get('password')
    port = secret.get('port', 5432)

    print(f"User: {username}")
    print(f"Port: {port}")

    # 3. Test Connection and List Tables
    print("Testing connection...")
    
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=username,
            password=password,
            port=port,
            connect_timeout=5
        )
        print("Successfully connected to Postgres!")
        
        cur = conn.cursor()
        
        # Resolve schema name (handle if it includes the 'interonproducts/' prefix or not)
        # We assume the SSM param holds the actual schema name "interonproducts" or similar.
        # But let's check what was fetched.
        print(f"Target Schema: {schema_name}")
        
        # Query for tables in the specific schema
        query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_type = 'BASE TABLE';
        """
        cur.execute(query, (schema_name,))
        tables = cur.fetchall()
        
        if tables:
            print(f"\nTables in schema '{schema_name}':")
            for table in tables:
                print(f" - {table[0]}")
        else:
            print(f"\nNo tables found in schema '{schema_name}'.")
            
            # Debug: List all schemas to verify
            print("\nAvailable schemas:")
            cur.execute("SELECT schema_name FROM information_schema.schemata;")
            for schema in cur.fetchall():
                print(f" - {schema[0]}")

        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Connection/Query failed: {e}")

if __name__ == "__main__":
    test_connection()
