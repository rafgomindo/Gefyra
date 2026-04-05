import json
import os

with open('suspect_parent_mapping.json', encoding='utf-8') as f:
    mapping = json.load(f)

snippet_keys = set()
if os.path.exists('pdf_snippets.jsonl'):
    with open('pdf_snippets.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            try:
                snippet_keys.add(json.loads(line)['key'])
            except: continue

missing = [m for m in mapping if m['pdfKey'] and m['pdfKey'] not in snippet_keys]
print(f"Total suspect parents: {len(mapping)}")
print(f"Missing snippets for PDF children: {len(missing)}")
for m in missing:
    print(f"  [Parent {m['parentKey']}] PDF child: {m['pdfKey']}")
