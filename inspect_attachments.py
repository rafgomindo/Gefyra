import sqlite3
import json

conn=sqlite3.connect('tmp_zotero.sqlite')
cursor=conn.cursor()

# Check itemAttachments table
try:
    cursor.execute('PRAGMA table_info(itemAttachments)')
    columns = cursor.fetchall()
    print("itemAttachments columns:")
    print(json.dumps(columns, indent=2))
except Exception as e:
    print(f"Error checking itemAttachments: {e}")

# Check itemData and titles for a few items
try:
    cursor.execute("""
        SELECT i.key, it.typeName, v.value 
        FROM items i 
        JOIN itemTypes it ON i.itemTypeID = it.itemTypeID
        JOIN itemData id ON i.itemID = id.itemID 
        JOIN itemDataValues v ON id.valueID = v.valueID 
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = 'title'
        LIMIT 5
    """)
    print("Sample items with titles:")
    print(json.dumps(cursor.fetchall(), indent=2))
except Exception as e:
    print(f"Error checking sample items: {e}")

conn.close()
