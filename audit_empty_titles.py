import json
import requests

def main():
    uid = "7679932"
    key = "mGvqRaKVSavhQqD2RQh1vL9A"
    
    suspects = []
    start = 0
    limit = 100
    
    print("Auditing Zotero parents for empty or filename-like titles...")
    
    for _ in range(30): # Up to 3000 items
        url = f"https://api.zotero.org/users/{uid}/items?start={start}&limit={limit}&itemType=-attachment"
        r = requests.get(url, headers={'Zotero-API-Key': key})
        items = r.json()
        if not items: break
        
        for item in items:
            title = item['data'].get('title', '').strip()
            # Suspect if:
            # 1. Title is empty
            # 2. Title has underscores (rare in real titles)
            # 3. Title looks like the user's examples (long alphanumeric with underscores)
            if not title or '_' in title or len(title) < 5:
                suspects.append({
                    "key": item['key'],
                    "title": title,
                    "type": item['data']['itemType'],
                    "version": item['version']
                })
        
        start += limit
        if len(items) < limit: break

    print(f"Found {len(suspects)} suspect parents.")
    for s in suspects[:10]:
        print(f"  [{s['key']}] '{s['title']}'")

    with open('suspect_empty_titles.json', 'w', encoding='utf-8') as f:
        json.dump(suspects, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
