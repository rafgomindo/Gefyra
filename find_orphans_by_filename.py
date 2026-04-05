import re
import os

targets = [
    "Frame_Analysis",
    "FUSI_JP",
    "garcia-alvarez",
    "GALTUNG"
]

found = []
with open('zotero_file_paths.csv', 'r', encoding='utf-8') as f:
    for line in f:
        if any(t in line for t in targets):
            found.append(line.strip())

print(f"Searching for user's problematic files in global inventory...")
for f in found:
    print(f"  {f}")
