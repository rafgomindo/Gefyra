import json
import os

with open('suspect_empty_titles.json', encoding='utf-8') as f:
    suspects = json.load(f)

# Collect OCR snippets
snippets = {}
if os.path.exists('pdf_snippets.jsonl'):
    with open('pdf_snippets.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            try:
                obj = json.loads(line)
                key = obj['key']
                text = (obj.get('text') or obj.get('first_page_text', '')).strip()
                if text: snippets[key] = text
            except: continue

# Check availability for the components
# We need to know the mapping parent -> child for these 439
# But wait, many suspect items are children themselves if they are orphans.
# Or they are parent items whose children we already mapped.

with open('suspect_parent_mapping.json', encoding='utf-8') as f:
    mapping = {m['parentKey']: m['pdfKey'] for m in json.load(f)}

results = {
    "has_ocr_text": 0,
    "empty_ocr_text": 0,
    "missing_snippet": 0,
    "will_use_filename": 0
}

for s in suspects:
    pk = s['key']
    child_key = mapping.get(pk)
    
    if child_key in snippets:
        results["has_ocr_text"] += 1
    elif child_key:
        results["empty_ocr_text"] += 1
        results["will_use_filename"] += 1
    else:
        results["missing_snippet"] += 1
        results["will_use_filename"] += 1

print(json.dumps(results, indent=2))
