import json

with open('broken_items_audit.json', encoding='utf-8') as f:
    data = json.load(f)

items = data.get('brokenItems', [])
print(f"Total broken items in data: {len(items)}")

# Check first one
if items:
    print(f"First item: {items[0]}")
