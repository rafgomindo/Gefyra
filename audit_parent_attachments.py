import json
import requests
import time

def main():
    uid = "7679932"
    key = "mGvqRaKVSavhQqD2RQh1vL9A"
    
    with open('suspect_titles_audit.json', encoding='utf-8') as f:
        suspects = json.load(f)
    
    mapping = []
    print(f"Finding child attachments for {len(suspects)} parents...")
    
    for s in suspects:
        url = f"https://api.zotero.org/users/{uid}/items/{s['key']}/children"
        r = requests.get(url, headers={'Zotero-API-Key': key})
        children = r.json()
        
        pdf_key = None
        for child in children:
            if child['data'].get('contentType') == 'application/pdf':
                pdf_key = child['key']
                break
        
        mapping.append({
            "parentKey": s['key'],
            "parentTitle": s['title'],
            "pdfKey": pdf_key
        })
        time.sleep(0.1) # Be nice to the API

    with open('suspect_parent_mapping.json', 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    
    print("Mapping complete.")

if __name__ == "__main__":
    main()
