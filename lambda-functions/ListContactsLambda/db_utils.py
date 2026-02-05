import json
import boto3
import pg8000.native
import os
from datetime import datetime
from decimal import Decimal

# Initialize SSM and Secrets Manager clients
# We initialize them outside the handler for potential reuse (though Lambda environments freeze/thaw)
ssm_client = boto3.client('ssm', region_name='us-east-2')
secrets_client = boto3.client('secretsmanager', region_name='us-east-2')

# Cache for config to avoid repeated calls in warm starts
_db_config = None

def get_ssm_parameter(name):
    # Removed try/except for debugging
    response = ssm_client.get_parameter(Name=name, WithDecryption=True)
    return response['Parameter']['Value']

def get_secret(secret_name):
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        if 'SecretString' in response:
            return json.loads(response['SecretString'])
        return None
    except Exception as e:
        print(f"Error fetching secret {secret_name}: {e}")
        return None

def get_db_connection():
    global _db_config
    
    if not _db_config:
        print("Loading DB config from SSM/Secrets Manager...")
        db_host = get_ssm_parameter('/interonproducts/DB_HOST')
        db_name = get_ssm_parameter('/interonproducts/DB_NAME')
        secret_key_name = get_ssm_parameter('/interonproducts/DB_SECRET_MANAGER_KEY')
        
        if not all([db_host, db_name, secret_key_name]):
            raise Exception("Missing required SSM parameters")
            
        secret = get_secret(secret_key_name)
        if not secret:
            raise Exception("Missing DB credentials")
            
        _db_config = {
            'host': db_host,
            'database': db_name,
            'user': secret.get('username'),
            'password': secret.get('password'),
            'port': int(secret.get('port', 5432))
        }
    
    # Establish connection
    try:
        conn = pg8000.native.Connection(
            user=_db_config['user'],
            password=_db_config['password'],
            host=_db_config['host'],
            port=_db_config['port'],
            database=_db_config['database'],
            timeout=10
        )
        return conn
    except Exception as e:
        print(f"DB Connection failed: {e}")
        raise e

def dict_factory(cols, row):
    """Convert a row to a dictionary using column names."""
    d = {}
    for idx, col in enumerate(cols):
        val = row[idx]
        if isinstance(val, datetime):
            val = val.isoformat()
        elif isinstance(val, Decimal):
            val = float(val)
        d[col['name']] = val
    return d

def query(conn, sql, params=None):
    """Execute a query and return list of dicts."""
    try:
        if params:
            # pg8000 native uses strict parameter handling
             result = conn.run(sql, **params) if isinstance(params, dict) else conn.run(sql, *params)
        else:
            result = conn.run(sql)
            
        # pg8000 native returns rows as list of lists
        # We need to map them to column names
        columns = conn.columns
        return [dict_factory(columns, row) for row in result]
    except Exception as e:
        print(f"Query failed: {sql} | Error: {e}")
        raise e
