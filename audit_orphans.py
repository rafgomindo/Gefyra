import sqlite3
import json

db_path = "tmp_zotero.sqlite"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the itemTypeID for attachments
cursor.execute("SELECT itemTypeID FROM itemTypes WHERE typeName = 'attachment'")
attachment_type_id = cursor.fetchone()[0]

# Count orphans
cursor.execute(f"SELECT count(*) FROM items WHERE itemTypeID = {attachment_type_id} AND parentItemID IS NULL")
orphan_count = cursor.fetchone()[0]

# Total items
cursor.execute("SELECT count(*) FROM items WHERE itemTypeID != ?", (attachment_type_id,))
regular_items_count = cursor.fetchone()[0]

print(f"Orphaned Attachments: {orphan_count}")
print(f"Regular Items: {regular_items_count}")

# Get some orphaned keys
cursor.execute(f"SELECT key FROM items WHERE itemTypeID = {attachment_type_id} AND parentItemID IS NULL LIMIT 20")
orphan_keys = [r[0] for r in cursor.fetchall()]

# Get some titles for regular items to see what's broken
cursor.execute("""
    SELECT i.key, v.value 
    FROM items i 
    JOIN itemData id ON i.itemID = id.itemID 
    JOIN itemDataValues v ON id.valueID = v.valueID 
    JOIN fields f ON id.fieldID = f.fieldID
    WHERE f.fieldName = 'title' 
    AND (v.value LIKE '%Full Text%' OR v.value LIKE '%PDF%' OR v.value = '')
    LIMIT 20
""")
bad_title_items = [{"key": r[0], "title": r[1]} for r in cursor.fetchall()]

conn.close()

results = {
    "orphan_count": orphan_count,
    "regular_items_count": regular_items_count,
    "orphan_keys": orphan_keys,
    "bad_title_items": bad_title_items
}

with open("orphan_audit.json", "w") as f:
    json.dump(results, f, indent=2)
