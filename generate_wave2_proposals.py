import json
import re
import os

with open('wave2_parent_mapping.json', encoding='utf-8') as f:
    mapping = json.load(f)

snippets = {}
if os.path.exists('pdf_snippets.jsonl'):
    with open('pdf_snippets.jsonl', 'r', encoding='utf-8') as f:
        for L in f:
            try:
                obj = json.loads(L)
                snippets[obj['key']] = (obj.get('text') or obj.get('first_page_text', '')).strip()
            except: continue

def clean_filename(fname):
    if not fname: return ""
    base = fname.rsplit('.', 1)[0]
    # Replace underscores and dashes with spaces
    cleaned = re.sub(r'[_\-]+', ' ', base)
    # Correct common words
    cleaned = cleaned.title()
    return cleaned.strip()

def extract_title_ocr(text):
    if not text or len(text) < 10: return None
    lines = text.split('\n')
    for L in lines:
        L = L.strip()
        if len(L) > 20 and not re.search(r'http|doi|isbn|issn|chapter|page|section', L, re.I):
            return L
    return None

def main():
    proposals = []
    print(f"Generating Wave 2 proposals for {len(mapping)} items...")
    
    suspect_versions = {s['key']: s['version'] for s in json.load(open('suspect_empty_titles.json', encoding='utf-8'))}
    
    for m in mapping:
        pk = m['parentKey']
        current_title = m['parentTitle']
        pdf_key = m['pdfKey']
        filename = m['pdfFilename']
        version = suspect_versions.get(pk)
        
        ocr_text = snippets.get(pdf_key, "")
        ocr_title = extract_title_ocr(ocr_text)
        
        if ocr_title:
            proposal = ocr_title
            source = "ocr"
        else:
            proposal = clean_filename(filename)
            source = "filename"

        if proposal and proposal != current_title:
            proposals.append({
                "key": pk,
                "current": current_title,
                "proposed": proposal,
                "source": source,
                "pdfKey": pdf_key,
                "version": version
            })

    with open('wave2_rehabilitation_proposals.json', 'w', encoding='utf-8') as f:
        json.dump(proposals, f, indent=2, ensure_ascii=False)
    
    print(f"Phase 2 Complete: Generated {len(proposals)} proposals for Wave 2.")
    for p in proposals[:5]:
        print(f"  [{p['key']}] {p['current']} -> {p['proposed']} ({p['source']})")

if __name__ == "__main__":
    main()
