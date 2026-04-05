import { ZoteroClient } from "./zotero-client.js";
import * as fs from "fs";


async function main() {
    const client = new ZoteroClient();
    const audit = JSON.parse(fs.readFileSync("broken_items_audit.json", "utf-8")).brokenItems;
    
    // Collect snippets to check for OCR availability
    const snippets: Record<string, string> = {};
    const lines = fs.readFileSync("pdf_snippets.jsonl", "utf-8").split("\n");
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            snippets[obj.key] = obj.text || obj.first_page_text || "";
        } catch {}
    }

    console.log(`Rehabilitating ALL ${audit.length} remaining orphans...`);
    
    for (let i = 0; i < audit.length; i++) {
        const item = audit[i];
        const ck = item.key;
        if (!ck) {
            console.warn(`[${i+1}/${audit.length}] Skipping item with no key:`, item);
            continue;
        }
        const filename = item.filename || "Untitled PDF";

        // Check if item is still an orphan to avoid duplicates
        try {
            const item_info = await client.getItem(ck);
            if (item_info.data.parentItem) {
                console.log(`[${i+1}/${audit.length}] Skipping ${ck}: Already has parent ${item_info.data.parentItem}`);
                continue;
            }
        } catch (e: any) {
            console.warn(`  [WARN] Failed to check status of ${ck}:`, e.message);
        }
        
        const ocrText = snippets[ck] || "";
        let proposedTitle = "";
        let source = "";

        // 1. Try OCR
        if (ocrText.length > 50) {
            const lines = ocrText.split("\n");
            for (const L of lines) {
                const cleanL = L.trim();
                if (cleanL.length > 20 && !cleanL.includes("DOI") && !cleanL.includes("http")) {
                    proposedTitle = cleanL;
                    source = "ocr";
                    break;
                }
            }
        }

        // 2. Fallback to Filename
        if (!proposedTitle) {
            proposedTitle = filename.replace(/\.pdf$/i, "").replace(/[_\-]+/g, " ").trim();
            // Capitalize
            proposedTitle = proposedTitle.charAt(0).toUpperCase() + proposedTitle.slice(1);
            source = "filename";
        }

        console.log(`[${i+1}/${audit.length}] Rehabilitating ${ck} -> '${proposedTitle}' (${source})`);
        
        try {
            // Create New Parent
            const parentData = {
                itemType: "journalArticle",
                title: proposedTitle,
                tags: [{ tag: "gefyra:orphan-recovered" }, { tag: "gefyra:fixed" }]
            };
            
            const newParent = await client.createItem(parentData);
            const newParentKey = newParent.successful["0"].key;
            
            // Re-parent
            await client.reparentAttachment(ck, newParentKey);
        } catch (e: any) {
            console.error(`  [ERROR] Failed to fix orphan ${ck}:`, e.message);
        }

        // Throttling
        if (i > 0 && i % 10 === 0) await new Promise(r => setTimeout(r, 800));
    }
}

main();
