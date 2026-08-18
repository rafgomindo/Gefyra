import json
import sqlite3
import re

def clean_title(title):
    if not title: return ""
    # Remove file extensions and common storage prefixes
    title = re.sub(r'^(storage:|attachment:|fulltext:)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\.[a-zA-Z0-9]+$', '', title)
    title = title.replace('_', ' ').replace('-', ' ')
    return title.strip()

def extract_metadata(snippet, original_title):
    # Fix potential UTF-8 encoding issues in the snippet if it was read wrongly
    try:
        if isinstance(snippet, bytes):
            snippet = snippet.decode('utf-8')
    except: pass
    
    lines = [L.strip() for L in snippet.split('\n') if L.strip()]
    
    # 1. Title Heuristics
    suggested_title = None
    if lines:
        for i, line in enumerate(lines[:10]):
            # Skip very short lines or common headers
            if len(line) < 15: continue
            if re.search(r'^\d+$|chapter|section|part|volume|issn|isbn|http', line, re.I): continue
            
            suggested_title = line
            # Join with next line if it's longer and doesn't start with a capital
            if i+1 < len(lines) and len(lines[i+1]) > 10 and not lines[i+1][0].isupper():
                suggested_title += " " + lines[i+1]
            break
        
    if not suggested_title:
        suggested_title = clean_title(original_title)

    # 2. Year Heuristics
    years = re.findall(r'\b(19|20)\d{2}\b', snippet)
    suggested_year = years[0] if years else None

    # 3. Creator/Author Heuristics
    creators = []
    author_section = " ".join(lines[1:10])
    match = re.search(r'(?:By|Author|Authors|Directeur|Coordination):\s*([A-Z][a-z]+ [A-Z][a-z]+(?: and [A-Z][a-z]+ [A-Z][a-z]+)?)', author_section, re.I)
    if match:
        names = [n.strip() for n in match.group(1).split(' and ')]
        for name in names:
            parts = name.split(' ')
            if len(parts) >= 2:
                creators.append({
                    "creatorType": "author",
                    "firstName": " ".join(parts[:-1]),
                    "lastName": parts[-1]
                })
            else:
                creators.append({
                    "creatorType": "author",
                    "lastName": name,
                    "firstName": ""
                })

    # 4. Determine Item Type
    item_type = "journalArticle" # default
    if re.search(r'book|ouvrage', snippet, re.I):
        item_type = "book"
    elif re.search(r'rapport|report', snippet, re.I):
        item_type = "report"
    elif re.search(r'thesis|thèse', snippet, re.I):
        item_type = "thesis"
    elif re.search(r'section|chapitre', snippet, re.I):
        item_type = "bookSection"

    return {
        "title": suggested_title.strip() if suggested_title else None,
        "year": suggested_year,
        "creators": creators,
        "type": item_type
    }

# Load Audit
try:
    with open("broken_items_audit.json", "r", encoding="utf-8") as f:
        audit = json.load(f)
except Exception as e:
    print(f"Error loading audit: {e}")
    audit = {"brokenItems": []}

# Load Snippets
snippets = {}
try:
    with open("pdf_snippets.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            try:
                item = json.loads(line)
                snippets[item['key']] = item
            except: continue
except Exception as e:
    print(f"Error loading snippets: {e}")

# Process
proposals = []
for item in audit.get('brokenItems', []):
    key = item['key']
    meta = None
    if key in snippets:
        s = snippets[key]
        # Use 'text' which is what mass_extract.py produces
        snippet_text = s.get('text') or s.get('first_page_text') or ''
        meta = extract_metadata(snippet_text, item.get('title', ''))
        
    p = {
        "key": key,
        "current": {
            "title": item.get('title'),
            "type": item.get('itemType')
        },
        "proposed": meta or {
            "title": clean_title(item.get('title')),
            "type": "journalArticle",
            "year": None,
            "creators": []
        },
        "action": "upgrade", # Always upgrade orphans to give them a parent
        "orphan": item.get('itemType') == "attachment"
    }
    # If it's not an orphan and we have no meta, don't upgrade
    if not p['orphan'] and not meta:
        p['action'] = "none"
        
    proposals.append(p)

with open("rehabilitation_proposals.json", "w", encoding="utf-8") as f:
    json.dump(proposals, f, indent=2, ensure_ascii=False)

print(f"Total Proposals: {len(proposals)}")
print(f"Upgrades Found: {len([p for p in proposals if p['action'] == 'upgrade'])}")
