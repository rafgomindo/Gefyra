import requests
import json
import collections

uid = "7679932"
key = "mGvqRaKVSavhQqD2RQh1vL9A"

def clean_for_match(text):
    if not text: return ""
    return "".join(filter(str.isalnum, text.lower()))

def main():
    items = []
    limit = 100
    start = 0
    total_checked = 0
    
    print("Downloading parent items for duplicate detection...")
    
    while True:
        # We only want top-level regular items (exclude attachments/notes for matching)
        url = f"https://api.zotero.org/users/{uid}/items?limit={limit}&start={start}"
        # Filter in memory to avoid extra requests for children if possible
        r = requests.get(url, headers={'Zotero-API-Key': key})
        page = r.json()
        
        if not page: break
        
        for item in page:
            total_checked += 1
            data = item['data']
            if data.get('itemType') not in ['attachment', 'note']:
                items.append({
                    "key": item['key'],
                    "title": data.get('title', ''),
                    "creator": data.get('creators', [{}])[0].get('lastName', '') if data.get('creators') else '',
                    "date": data.get('date', ''),
                    "version": item['version'],
                    "numChildren": data.get('numChildren', 0)
                })
        
        start += limit
        print(f"  Downloaded {total_checked} items. Filtering parents...")
        
        # Guard rail
        if total_checked > 10000: break

    # 2. Group by normalized title + creator
    groups = collections.defaultdict(list)
    for i in items:
        # Use a flexible match: Title + creator (if available)
        match_key = clean_for_match(i['title']) + "|" + clean_for_match(i['creator'])
        if len(match_key) > 10: # Avoid empty matching
            groups[match_key].append(i)

    # 3. Report duplicates
    duplicates = {k: v for k, v in groups.items() if len(v) > 1}
    
    proposal = []
    for k, v in duplicates.items():
        # Choose survivor: Prefer the one with more children, or the one with a year if others don't
        # Actually, let's prefer the one with the MOST children.
        v.sort(key=lambda x: x['numChildren'], reverse=True)
        survivor = v[0]
        extras = v[1:]
        proposal.append({
            "survivor": survivor,
            "extras": extras
        })

    with open('duplicate_fusion_proposals.json', 'w', encoding='utf-8') as f:
        json.dump(proposal, f, indent=2)
    
    print(f"Detection Complete! Found {len(proposal)} sets of duplicates.")

if __name__ == "__main__":
    main()
