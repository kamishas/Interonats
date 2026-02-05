import json
from datetime import datetime

try:
    # Handle encoding
    try:
        with open('campaigns_dump.json', encoding='utf-16') as f:
            data = json.load(f)
    except:
        with open('campaigns_dump.json', encoding='utf-8') as f:
            data = json.load(f)

    items = data.get('Items', [])
    print(f"Total Campaigns Found: {len(items)}")
    
    # Sort by updatedAt is tricky in DynamoDB JSON format, try simplified
    print("\n--- Recent Campaigns (Last 10) ---")
    
    # Simple parser for DynamoDB JSON
    parsed_items = []
    for item in items:
        # Extract fields
        c_id = item.get('campaignId', {}).get('S', 'Unknown')
        status = item.get('status', {}).get('S', 'Unknown')
        category = item.get('category', {}).get('S', 'MISSING')
        updated = item.get('updatedAt', {}).get('S', '')
        
        parsed_items.append({
            'id': c_id,
            'status': status,
            'category': category,
            'updated': updated
        })

    # Sort by updated date (descending)
    parsed_items.sort(key=lambda x: x['updated'], reverse=True)
    
    for p in parsed_items[:10]:
        print(f"ID: {p['id']}")
        print(f"  Updated: {p['updated']}")
        print(f"  Status:  {p['status']}")
        print(f"  Category: {p['category']}")
        print("-" * 30)

except Exception as e:
    print(f"Error: {e}")
