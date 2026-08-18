import json
import os

key = "GLQH6UF6"
if os.path.exists('pdf_snippets.jsonl'):
    with open('pdf_snippets.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            if key in line:
                obj = json.loads(line)
                print(f"Snippet for {key}: '{obj.get('text', '')[:100]}...'")
                break
else:
    print("pdf_snippets.jsonl NOT found.")
