import json
import re

def clean_title(title):
    if not title: return ""
    title = re.sub(r'\.(pdf|doc|docx|txt|html?|ppt|pptx)$', '', title, flags=re.IGNORECASE)
    title = title.replace('_', ' ').replace('-', ' ')
    # If the title is all caps and short, just return as is (e.g. RCE4)
    if len(title) < 10 and title.isupper(): return title
    # Otherwise, title case if it's all lowercase
    if title.islower(): return title.title()
    return title.strip()

def extract_metadata(snippet, original_title):
    lines = [L.strip() for L in snippet.split('\n') if L.strip()]
    suggested_title = None
    if lines:
        for i, line in enumerate(lines[:10]):
            if len(line) < 15: continue
            if re.search(r'^\d+$|chapter|section|part|volume|issn|isbn|http', line, re.I): continue
            suggested_title = line
            if i+1 < len(lines) and len(lines[i+1]) > 10 and not lines[i+1][0].isupper():
                suggested_title += " " + lines[i+1]
            break
    if not suggested_title:
        suggested_title = clean_title(original_title)
    return suggested_title

def main():
    with open('suspect_parent_mapping.json', encoding='utf-8') as f:
        mapping = json.load(f)
    
    snippets = {}
    if os.path.exists('pdf_snippets.jsonl'):
        with open('pdf_snippets.jsonl', 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    snippets[obj['key']] = obj
                except: continue

    proposals = []
    for m in mapping:
        parentKey = m['parentKey']
        pdfKey = m['pdfKey']
        currentTitle = m['parentTitle']
        
        proposedTitle = None
        if pdfKey in snippets:
            snippet_text = snippets[pdfKey].get('text') or snippets[pdfKey].get('first_page_text', '')
            proposedTitle = extract_metadata(snippet_text, currentTitle)
        else:
            proposedTitle = clean_title(currentTitle)
            
        proposals.append({
            "key": parentKey,
            "current": currentTitle,
            "proposed": proposedTitle,
            "action": "patch" if proposedTitle != currentTitle else "none"
        })

    with open('parent_rehabilitation_proposals.json', 'w', encoding='utf-8') as f:
        json.dump(proposals, f, indent=2, ensure_ascii=False)
    
    print(f"Generated {len([p for p in proposals if p['action'] == 'patch'])} parent patch proposals.")

if __name__ == "__main__":
    import os
    main()
