import json
import requests

uid = "7679932"
key = "mGvqRaKVSavhQqD2RQh1vL9A"
child_keys = ["GLQH6UF6", "B5D86HXD"] # The ones I found in search

def main():
    for ck in child_keys:
        url = f"https://api.zotero.org/users/{uid}/items/{ck}"
        r = requests.get(url, headers={'Zotero-API-Key': key})
        data = r.json().get('data', {})
        parent = data.get('parentItem')
        title = data.get('title')
        print(f"Child {ck} (title: {title}) has Parent Item: {parent}")
        
        if parent:
            url_p = f"https://api.zotero.org/users/{uid}/items/{parent}"
            rp = requests.get(url_p, headers={'Zotero-API-Key': key})
            p_data = rp.json().get('data', {})
            print(f"  Parent Data: Type={p_data.get('itemType')}, Title='{p_data.get('title')}'")

if __name__ == "__main__":
    main()
