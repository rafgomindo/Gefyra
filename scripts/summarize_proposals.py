import json

with open('rehabilitation_proposals.json', encoding='utf-8') as f:
    data = json.load(f)

orphans = [p for p in data if p['orphan'] and p['action'] == 'upgrade']
broken_regular = [p for p in data if not p['orphan'] and p['action'] == 'upgrade']

print(f"Orphans with upgrade: {len(orphans)}")
print(f"Broken regular with upgrade: {len(broken_regular)}")

# Show a few examples
print("\nTop 5 Examples:")
for p in orphans[:5]:
    print(f"- {p['key']} | {p['current']['title']} -> {p['proposed']['title']}")
