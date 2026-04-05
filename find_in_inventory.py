import json

with open('zotero_file_paths.json', encoding='utf-8') as f:
    data = json.load(f)

targets = ["Frame_Analysis", "FUSI_JP", "garcia-alvarez", "GALTUNG"]
matches = [item for item in data if any(t in str(item) for t in targets)]

print(f"Found {len(matches)} matches in local inventory:")
for m in matches:
    print(f"  {m}")
