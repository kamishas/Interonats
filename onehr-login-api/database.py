import os
import json
import boto3
import pg8000
from contextlib import contextmanager
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
import time

# --- Configuration (Req 5, 8) ---
_param_cache = {}

def get_param(name, default=None):
    """Retrieve parameter: SSM (Priority) > Env Var"""
    
    # 1. Try SSM (Prioritize /interonproducts/)
    ssm = boto3.client('ssm', region_name='us-east-2')
    path = name
    if not path.startswith('/interonproducts/'):
        if path.startswith('/oneHR/'):
            path = '/interonproducts/' + path[len('/oneHR/'):]
        else:
            path = '/interonproducts/' + path.lstrip('/')
            
    try:
        val = ssm.get_parameter(Name=path, WithDecryption=True)['Parameter']['Value']
        _param_cache[name] = val
        return val
    except:
        # 2. Fallback to Env Var only if SSM failed
        env_key = name.split('/')[-1]
        if env_key in os.environ:
             return os.environ[env_key]

        if default is not None: return default
        print(f"DEBUG: Missing parameter {path} (and no Env Var {env_key})")
        return None

class DatabaseConfig:
    def __init__(self):
        self.host = None
        self.database = None
        self.user = None
        self.password = None
        self.port = 5432
        self._load_config()
    
    def _load_config(self):
        try:
            # NEW: Only use /interonproducts/ paths
            self.host = get_param('/interonproducts/DB_HOST')
            self.database = get_param('/interonproducts/DB_NAME')
            self.port = int(get_param('/interonproducts/DB_PORT') or 5432)
            
            try:
                self.user = get_param('/interonproducts/DB_USER')
                self.password = get_param('/interonproducts/DB_PASSWORD')
            except:
                self.user = None
                self.password = None
            
            if not (self.user and self.password):
                secret_key = get_param("/interonproducts/DB_SECRET_MANAGER_KEY")
                
                sm = boto3.client('secretsmanager', region_name='us-east-2')
                secret = json.loads(sm.get_secret_value(SecretId=secret_key)['SecretString'])
                
                self.user = secret.get('username', 'postgres')
                self.password = secret.get('password')
                
        except Exception as e:
            print(f"DB Config Load Error: {e}")
            raise e

db_config = DatabaseConfig()

class Database:
    @staticmethod
    @contextmanager
    def get_connection():
        conn = None
        try:
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            conn = pg8000.connect(
                host=db_config.host,
                database=db_config.database,
                user=db_config.user,
                password=db_config.password,
                port=db_config.port,
                ssl_context=ssl_context
            )
            
            # Set search path to 'onehr' where the tables actually reside
            cursor = conn.cursor()
            cursor.execute("SET search_path TO onehr, public")
            cursor.close()
            
            yield conn
            conn.commit()
        except Exception as e:
            if conn: conn.rollback()
            raise e
        finally:
            if conn: conn.close()

    @staticmethod
    def execute_one(query, params=None):
        with Database.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None

    @staticmethod
    def execute_query(query, params=None):
        with Database.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            if rows:
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, r)) for r in rows]
            return []

# Backward Compatibility
def execute_one(query, params=None): return Database.execute_one(query, params)
def execute_query(query, params=None): return Database.execute_query(query, params)
def test_connection():
    with Database.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
    return True
