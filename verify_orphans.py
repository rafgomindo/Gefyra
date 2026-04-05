import json

with open('broken_items_audit.json', encoding='utf-8') as f:
    data = json.load(f)
    print(f"Total: {len(data['brokenItems'])}")
    for i in data['brokenItems']:
        if i.get('key') == 'GLQH6UF6' or 'Frame' in i.get('filename', ''):
            print(f"FOUND: {i}")
