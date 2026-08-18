import json
import os
import re
from pypdf import PdfReader

# Configuration: Zotero Storage
ZOTERO_STORAGE_DIR = r"C:\Users\sdjrp\Zotero\storage"

def get_pdf_path(item_key, item_path):
    item_dir = os.path.join(ZOTERO_STORAGE_DIR, item_key)
    if not os.path.exists(item_dir):
        return None
    
    # Try exact match from the path stored in Zotero
    actual_name = item_path.replace("storage:", "")
    full_path = os.path.join(item_dir, actual_name)
    if os.path.exists(full_path) and full_path.lower().endswith(".pdf"):
        return full_path
        
    # Fallback search: find any PDF in the directory
    try:
        files = os.listdir(item_dir)
        for f in files:
            if f.lower().endswith(".pdf"):
                return os.path.join(item_dir, f)
    except:
        pass
    return None

def main():
    manifest_path = "zotero_file_paths.json"
    audit_path = "broken_items_audit.json"
    output_path = "pdf_snippets.jsonl"
    
    # Load already processed keys
    processed_keys = set()
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    processed_keys.add(obj["key"])
                except: pass
    
    print(f"Already processed: {len(processed_keys)}")

    # Load Audit items (only process what's broken)
    if not os.path.exists(audit_path):
        print("Audit file missing.")
        return
    with open(audit_path, "r", encoding="utf-8") as f:
        audit = json.load(f)
    
    broken_keys = set(it["key"] for it in audit.get("brokenItems", []))
    print(f"Broken items in audit: {len(broken_keys)}")

    # Load File Paths
    if not os.path.exists(manifest_path):
        print("Manifest missing.")
        return
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    
    # Filter: Broken AND NOT Processed
    candidates = [it for it in manifest if it["key"] in broken_keys and it["key"] not in processed_keys]
    print(f"Candidates to process: {len(candidates)}")

    processed = 0
    # Open for appending
    with open(output_path, "a", encoding="utf-8") as out:
        for it in candidates:
            pdf_p = get_pdf_path(it["key"], it["path"])
            if not pdf_p:
                continue
                
            try:
                reader = PdfReader(pdf_p)
                text = ""
                if len(reader.pages) > 0:
                    try:
                        text = reader.pages[0].extract_text() or ""
                    except: pass
                
                meta = reader.metadata
                snippet = {
                    "key": it["key"],
                    "original_title": it["path"],
                    "pdf_title": (meta.title if meta and meta.title else ""),
                    "pdf_author": (meta.author if meta and meta.author else ""),
                    "first_page_text": text[:2000].replace("\n", " ")
                }
                out.write(json.dumps(snippet, ensure_ascii=False) + "\n")
                processed += 1
                if processed % 50 == 0:
                    print(f"Processed {processed}...")
            except Exception as e:
                # Log error silently
                continue
                
    print(f"Mass extraction complete. Snippets added for {processed} items.")

if __name__ == "__main__":
    main()
