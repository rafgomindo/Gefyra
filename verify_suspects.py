import json

with open('suspect_empty_titles.json', encoding='utf-8') as f:
    data = json.load(f)

# The user's query fragments
targets = ["Frame_Analysis", "FUSI_JP", "garcia-alvarez", "GALTUNG"]

matches = []
for item in data:
    title = item['title']
    if any(t in title for t in targets) or not title:
        matches.append(item)

print(f"Total suspects: {len(data)}")
print(f"Matches for user's report: {len([m for m in matches if m['title']])}")
print(f"Empty titles: {len([m for m in matches if not m['title']])}")

# Find child PDF for one problematic item if possible
print("First few matches:")
for m in matches[:20]:
    print(f"  [{m['key']}] '{m['title']}'")
