import sqlite3
import json

conn=sqlite3.connect('tmp_zotero.sqlite')
cursor=conn.cursor()
cursor.execute('PRAGMA table_info(items)')
columns = cursor.fetchall()
print(json.dumps(columns, indent=2))
conn.close()
