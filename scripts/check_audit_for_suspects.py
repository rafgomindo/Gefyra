import json

with open('broken_items_audit.json', encoding='utf-8') as f:
    audit = json.load(f).get('brokenItems', [])

keys = {'L2T2YQAJ', 'QVNDF7RQ', 'IFU6X7F9'}
matches = [i for i in audit if i['key'] in keys]

print(f"Found {len(matches)} of {len(keys)} in audit.")
for m in matches:
    print(f"  [PDF {m['key']}] Path: {m.get('path')}")
