import json
import requests
import os

uid = "7679932"
key = "mGvqRaKVSavhQqD2RQh1vL9A"

# Load identified suspects (439 items)
with open('suspect_empty_titles.json', encoding='utf-8') as f:
    suspects = json.load(f)

def get_child_pdf(parent_key):
    try:
        url = f"https://api.zotero.org/users/{uid}/items/{parent_key}/children"
        r = requests.get(url, headers={'Zotero-API-Key': key})
        for child in r.json():
            if child['data'].get('contentType') == 'application/pdf':
                return {
                    "pdfKey": child['key'],
                    "pdfFilename": child['data'].get('filename', '')
                }
    except: pass
    return None

def main():
    mapping = []
    print(f"Mapping children for {len(suspects)} suspect parents...")
    
    for i, s in enumerate(suspects):
        pk = s['key']
        child_info = get_child_pdf(pk)
        if child_info:
            mapping.append({
                "parentKey": pk,
                "parentTitle": s['title'],
                "pdfKey": child_info['pdfKey'],
                "pdfFilename": child_info['pdfFilename']
            })
        
        if (i+1) % 50 == 0:
            print(f"  Processed {i+1} parents...")

    with open('wave2_parent_mapping.json', 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    print(f"Phase 1 Complete: Mapped {len(mapping)} children for Wave 2.")

if __name__ == "__main__":
    main()
