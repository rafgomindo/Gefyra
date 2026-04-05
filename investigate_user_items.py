import json
import os
import requests
import re

uid = "7679932"
key = "mGvqRaKVSavhQqD2RQh1vL9A"

# The items specifically mentioned by the user
target_parents = ["CDE95H27", "6WT2T5N3"]

def get_child_pdf(parent_key):
    url = f"https://api.zotero.org/users/{uid}/items/{parent_key}/children"
    r = requests.get(url, headers={'Zotero-API-Key': key})
    for child in r.json():
        if child['data'].get('contentType') == 'application/pdf':
            return child['key']
    return None

def main():
    snippets = {}
    if os.path.exists('pdf_snippets.jsonl'):
        with open('pdf_snippets.jsonl', 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    snippets[obj['key']] = obj
                except: continue

    results = []
    for pk in target_parents:
        pdf_key = get_child_pdf(pk)
        if pdf_key and pdf_key in snippets:
            snippet = snippets[pdf_key].get('text') or snippets[pdf_key].get('first_page_text', '')
            results.append({"parent": pk, "pdf": pdf_key, "snippet": snippet[:500]})
        else:
            results.append({"parent": pk, "pdf": pdf_key, "error": "Snippet missing"})

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
