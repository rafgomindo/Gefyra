import requests
import json

uid = "7679932"
key = "mGvqRaKVSavhQqD2RQh1vL9A"

def main():
    all_orphans = []
    limit = 100
    start = 0
    total_checked = 0
    
    print("Starting deep discovery of all attachments...")
    
    while True:
        url = f"https://api.zotero.org/users/{uid}/items?itemType=attachment&limit={limit}&start={start}"
        r = requests.get(url, headers={'Zotero-API-Key': key})
        items = r.json()
        
        if not items: break
        
        for item in items:
            total_checked += 1
            data = item['data']
            if not data.get('parentItem'):
                all_orphans.append({
                    "key": item['key'],
                    "filename": data.get('filename', 'Untitled'),
                    "version": item['version']
                })
        
        start += limit
        print(f"  Checked {total_checked} attachments. Found {len(all_orphans)} orphans so far...")
        
        # Guard rail
        if total_checked > 10000: break

    with open('deep_orphan_audit.json', 'w', encoding='utf-8') as f:
        json.dump(all_orphans, f, indent=2)
    
    print(f"Discovery Complete! Found {len(all_orphans)} deep orphans.")

if __name__ == "__main__":
    main()
