import requests
import json
import collections
import re

uid = "" # "7679932"
key = "" # "mGvqRaKVSavhQqD2RQh1vL9A"

def normalize_title(title):
    if not title: return ""
    # Remove common split suffixes
    # LA_INMIGRACION_..._Partie3 -> LA_INMIGRACION_...
    # LA_INMIGRACION_..._Partie 3 -> LA_INMIGRACION_...
    # LA_INMIGRACION_... (1) -> LA_INMIGRACION_...
    t = title
    t = re.sub(r'[_\-\s]+Partie[_\-\s]*\d+', '', t, flags=re.I)
    t = re.sub(r'[_\-\s]+Part[_\-\s]*\d+', '', t, flags=re.I)
    t = re.sub(r'[_\-\s]+[Pp]\d+', '', t, flags=re.I)
    t = re.sub(r'\s*\(\d+\)', '', t)
    t = re.sub(r'\s*Copy$', '', t, flags=re.I)
    return t.strip()

def main():
    items = []
    limit = 100
    start = 0
    total_checked = 0
    
    print("Downloading items for Part-Fusion detection...")
    
    while True:
        url = f"https://api.zotero.org/users/{uid}/items?limit={limit}&start={start}"
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
                    "version": item['version'],
                    "numChildren": data.get('numChildren', 0)
                })
        
        start += limit
        print(f"  Downloaded {total_checked} items...")
        if total_checked > 10000: break

    # 2. Group by Normalized Title
    groups = collections.defaultdict(list)
    for i in items:
        norm = normalize_title(i['title'])
        if len(norm) > 10:
            groups[norm].append(i)

    # 3. Report duplicates (Parts)
    proposal = []
    for norm, members in groups.items():
        if len(members) > 1:
            # Choose survivor: Prefer the one with the SHORTEST title (usually the master)
            # or the one with the most children
            members.sort(key=lambda x: (len(x['title']), -x['numChildren']))
            survivor = members[0]
            extras = members[1:]
            proposal.append({
                "survivor": survivor,
                "extras": extras,
                "normTitle": norm
            })

    with open('part_fusion_proposals.json', 'w', encoding='utf-8') as f:
        json.dump(proposal, f, indent=2)
    
    print(f"Part Detection Complete! Found {len(proposal)} Master items with split parts.")

if __name__ == "__main__":
    main()
