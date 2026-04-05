import sqlite3
import os
import json

ZOTERO_DB = "tmp_zotero.sqlite"

def main():
    if not os.path.exists(ZOTERO_DB):
        print(f"Error: {ZOTERO_DB} not found.")
        return

    try:
        conn = sqlite3.connect(ZOTERO_DB)
        cursor = conn.cursor()
        
        # Query for attachments, their keys, and paths
        query = """
        SELECT items.key, itemAttachments.path, itemAttachments.contentType, itemAttachments.linkMode
        FROM items
        JOIN itemAttachments ON items.itemID = itemAttachments.itemID
        WHERE itemAttachments.contentType = 'application/pdf'
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        data = []
        for key, path, ctype, link_mode in results:
            data.append({
                "key": key,
                "path": path,
                "linkMode": link_mode
            })
            
        with open("zotero_file_paths.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        print(f"Successfully indexed {len(data)} attachment paths.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
