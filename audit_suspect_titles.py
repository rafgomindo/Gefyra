import json
import os
import re
import requests

def is_suspect(title):
    if not title: return False
    # 1. Ends in file extension
    if re.search(r'\.(pdf|doc|docx|txt|html?|ppt|pptx)$', title, re.I):
        return True
    # 2. Short alphanumeric code (e.g. ifg1de1, JOAC2011B)
    # Typically 3-15 chars, mix of digits and letters, no spaces
    if 3 <= len(title) <= 20 and re.search(r'^[a-zA-Z0-9_\-]+$', title):
        # All lower case short strings or all upper case short strings are likely codes
        if title.islower() or title.isupper(): return True
        # Mix of numbers and letters
        if re.search(r'[0-9]', title) and re.search(r'[a-zA-Z]', title): return True
    return False

def main():
    # Attempt to load from local cache if we have one to save API calls
    # Or just query the first 2000 items if the library is large
    uid = "7679932"
    key = "mGvqRaKVSavhQqD2RQh1vL9A"
    
    suspects = []
    start = 0
    limit = 100
    
    print("Auditing Zotero parents for suspect titles...")
    
    # We'll do up to 30 pages (3000 items)
    for _ in range(30): 
        url = f"https://api.zotero.org/users/{uid}/items?start={start}&limit={limit}&itemType=-attachment"
        r = requests.get(url, headers={'Zotero-API-Key': key})
        items = r.json()
        if not items: break
        
        for item in items:
            title = item['data'].get('title', '')
            if is_suspect(title):
                suspects.append({
                    "key": item['key'],
                    "title": title,
                    "type": item['data']['itemType'],
                    "version": item['version']
                })
        
        start += limit
        if len(items) < limit: break

    print(f"Found {len(suspects)} suspect parent titles in first {start} items.")
    for s in suspects[:10]:
        print(f"  [{s['key']}] {s['title']}")

    with open('suspect_titles_audit.json', 'w', encoding='utf-8') as f:
        json.dump(suspects, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
