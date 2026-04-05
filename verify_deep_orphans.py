import json

with open('deep_orphan_audit.json', encoding='utf-8') as f:
    data = json.load(f)
    print(f"Total: {len(data)}")
    for i in data:
        if 'GALTUNG' in i['filename'].upper() or 'FRAME' in i['filename'].upper():
            print(f"FOUND: {i}")
