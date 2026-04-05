import json
import os

files_to_find = [
    "Frame_Analysis_pp_1_40.pdf",
    "FUSI_JP_1999_Franco_A_Biography.pdf",
    "garcia-alvarez-coque-2012-chapitre-17-mondialisation-agricole-et-produits-mediterraneens.pdf",
    "GALTUNG_J_1969_Violence_Peace_and_Peace_Research.pdf"
]

def search_in_file(filename):
    if not os.path.exists(filename): return
    print(f"Searching in {filename}...")
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        for target in files_to_find:
            if target in content:
                print(f"  FOUND: {target}")

search_in_file('broken_items_audit.json')
search_in_file('suspect_titles_audit.json')
search_in_file('suspect_empty_titles.json')
search_in_file('rehabilitated_audit.json')
