import json
import os
import re
from pypdf import PdfReader

def extract_first_page_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        if len(reader.pages) > 0:
            text = reader.pages[0].extract_text()
            return text[:2000] # Get first 2000 chars
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return None

def main():
    with open('broken_items_audit.json', encoding='utf-8') as f:
        audit_data = json.load(f)
    audit = audit_data.get('brokenItems', [])
    
    # Load existing snippets to skip them
    existing_keys = set()
    if os.path.exists('pdf_snippets.jsonl'):
        with open('pdf_snippets.jsonl', 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    existing_keys.add(obj['key'])
                except: continue

    print(f"Already have {len(existing_keys)} snippets.")
    
    count = 0
    with open('pdf_snippets.jsonl', 'a', encoding='utf-8') as f:
        for item in audit:
            key = item.get('key')
            if not key or key in existing_keys: continue
            
            pdf_path = item.get('path')
            if pdf_path and os.path.exists(pdf_path):
                print(f"Extracting [{key}]: {item['title']}...")
                text = extract_first_page_text(pdf_path)
                if text:
                    json.dump({"key": key, "text": text, "original_title": item['title']}, f, ensure_ascii=False)
                    f.write('\n')
                    count += 1
            
            if count >= 300: # Batch size for this run
                print("Reached batch limit (300). Stopping to avoid process timeout.")
                break

    print(f"Extracted {count} new snippets.")

if __name__ == "__main__":
    main()
