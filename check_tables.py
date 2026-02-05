import db_utils
import json

def check_structure():
    print("Connecting...")
    conn = db_utils.get_db_connection()
    print("Connected.")
    
    # Check Schemas
    print("\n--- Schemas ---")
    schemas = db_utils.query(conn, "SELECT schema_name FROM information_schema.schemata")
    for s in schemas:
        print(s['schema_name'])
        
    # Check Tables in all schemas
    print("\n--- Tables ---")
    tables = db_utils.query(conn, """
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name
    """)
    for t in tables:
        print(f"{t['table_schema']}.{t['table_name']}")

if __name__ == '__main__':
    check_structure()
