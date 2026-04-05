import json

def main():
    targets = ["GALTUNG", "Frame_Analysis", "Frontex", "FUSI"]
    with open('broken_items_audit.json', encoding='utf-8') as f:
        data = json.load(f)
        orphans = data.get('brokenItems', [])
        print(f"Total orphans in audit: {len(orphans)}")
        matches = [o for o in orphans if any(t in o.get('filename', '') for t in targets)]
        for m in matches:
            print(f"  [{m['childKey']}] {m['filename']}")

if __name__ == "__main__":
    main()
