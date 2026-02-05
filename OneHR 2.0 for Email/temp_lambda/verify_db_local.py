
import json
import boto3
import pg8000.native
import os
import sys

# Define constants manually to avoid dependency complexities if SSM fails locally
DB_HOST_PARAM = "/interonproducts/DB_HOST"
DB_NAME_PARAM = "/interonproducts/DB_NAME"
DB_SECRET_KEY_PARAM = "/interonproducts/DB_SECRET_MANAGER_KEY"

def get_ssm_param(param_name):
    ssm = boto3.client('ssm', region_name='us-east-2')
    response = ssm.get_parameter(Name=param_name, WithDecryption=True)
    return response['Parameter']['Value']

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-2')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

def verify_connection():
    try:
        print("1. Fetching Configuration...")
        
        # 1. Get Host & Name (which we updated)
        db_host = get_ssm_param(DB_HOST_PARAM)
        # db_name = get_ssm_param(DB_NAME_PARAM) # Was crashing
        db_name = "OneHRDev" # Try user's exact casing
        secret_key = get_ssm_param(DB_SECRET_KEY_PARAM)
        
        print(f"   Host: {db_host}")
        print(f"   DB Name: {db_name}")
        print(f"   Secret Key: {secret_key}")
        
        # 2. Get Credentials
        print("2. Fetching Credentials from Secrets Manager...")
        creds = get_secret(secret_key)
        user = creds.get('username')
        password = creds.get('password')
        port = int(creds.get('port', 5432))
        
        print(f"   User: {user}")
        print(f"   Port: {port}")
        
        # 3. Connect
        print("3. Connecting to Database...")
        conn = pg8000.native.Connection(
            user=user,
            password=password,
            host=db_host,
            port=port,
            database=db_name,
            timeout=10
        )
        print("   ✅ Connected successfully!")
        
        # 4. Query
        print("4. Querying email_agent.contacts...")
        result = conn.run("SELECT * FROM email_agent.contacts LIMIT 5")
        
        print(f"   ✅ Query successful. Found {len(result)} rows.")
        print("-" * 50)
        # conn.columns in pg8000 native are list of dicts like {'name': 'id', ...} 
        # or objects? Let's just print rows.
        
        for row in result:
             print(row)
             
        conn.close()
        
    except Exception as e:
        print("\n❌ CONNECTION ERROR:")
        print(e)
        if hasattr(e, 'args'): print(e.args)


if __name__ == "__main__":
    verify_connection()
