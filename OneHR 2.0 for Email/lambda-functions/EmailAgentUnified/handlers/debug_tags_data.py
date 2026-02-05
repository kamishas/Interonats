import json
import db_utils
from datetime import datetime

# Setup DB connection
try:
    print("Connecting to DB...")
    conn = db_utils.get_db_connection()
    
    # 1. List Tag Definitions
    print("\n--- Tag Definitions (email_agent.contact_tags) ---")
    tags = db_utils.query(conn, "SELECT * FROM email_agent.contact_tags")
    for t in tags:
        print(f"Tag: '{t['tag_name']}' | Color: {t['color']}")

    # 2. List Contacts with Tags
    print("\n--- Contacts with Tags (email_agent.contacts) ---")
    contacts = db_utils.query(conn, "SELECT email, tags FROM email_agent.contacts WHERE array_length(tags, 1) > 0")
    for c in contacts:
        print(f"Email: {c['email']} | Tags: {c['tags']}")

    conn.close()
    print("\nDone.")

except Exception as e:
    print(f"Error: {e}")
