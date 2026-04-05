import json
import requests
import re

uid = "7679932"
key = "mGvqRaKVSavhQqD2RQh1vL9A"

# The items reported by the user
targets = [
    "Frame_Analysis_pp_1_40.pdf",
    "Framing_Social_Interaction_Partie1.pdf",
    "Frontex_2009_Annual_Reports.pdf", 
    "Frontex_2010_Annual_Risk_Analysis.pdf",
    "FUSI_JP_1999_Franco_A_Biography.pdf",
    "GALTUNG_J_1969_Violence_Peace_and_Peace_Research.pdf"
]

def clean_name(fname):
    base = fname.split('.pdf')[0]
    return re.sub(r'[_\-]+', ' ', base).title()

def main():
    # 1. Find the keys for these filenames in local inventory
    with open('zotero_file_paths.json', encoding='utf-8') as f:
        inventory = json.load(f)
    
    matches = []
    for item in inventory:
        fname = item.get('path', '').replace('storage:', '')
        if any(t == fname for t in targets):
            matches.append({"key": item['key'], "filename": fname})

    print(f"Found {len(matches)} matching attachment items in inventory.")

    for m in matches:
        ck = m['key']
        fname = m['filename']
        title = clean_name(fname)
        
        print(f"Fixing {ck} ('{fname}') -> Title: '{title}'")
        
        # Check current parent
        url = f"https://api.zotero.org/users/{uid}/items/{ck}"
        r = requests.get(url, headers={'Zotero-API-Key': key})
        item_data = r.json().get('data', {})
        parent = item_data.get('parentItem')
        
        if parent:
            print(f"  Item has parent {parent}. Updating parent title...")
            # Update parent
            url_p = f"https://api.zotero.org/users/{uid}/items/{parent}"
            rp = requests.get(url_p, headers={'Zotero-API-Key': key})
            p_full = rp.json()
            p_data = p_full.get('data', {})
            p_data['title'] = title
            p_data['tags'] = p_data.get('tags', []) + [{"tag": "gefyra:fixed"}]
            requests.patch(url_p, headers={'Zotero-API-Key': key, 'If-Unmodified-Since-Version': str(p_full['version'])}, json=p_data)
        else:
            print(f"  Item is orphan. Creating new parent...")
            # Create new parent
            p_obj = {
                "itemType": "journalArticle",
                "title": title,
                "tags": [{"tag": "gefyra:fixed"}]
            }
            r_create = requests.post(f"https://api.zotero.org/users/{uid}/items", headers={'Zotero-API-Key': key}, json=[p_obj])
            new_pk = r_create.json()['successful']['0']['key']
            # Re-parent
            item_data['parentItem'] = new_pk
            requests.patch(url, headers={'Zotero-API-Key': key, 'If-Unmodified-Since-Version': str(r.json()['version'])}, json=item_data)

if __name__ == "__main__":
    main()
