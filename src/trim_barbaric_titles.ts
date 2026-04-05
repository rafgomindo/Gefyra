import { ZoteroClient } from "./zotero-client.js";
import * as fs from "fs";

async function main() {
    const client = new ZoteroClient();
    console.log("Starting Mass-Trim of Barbaric Titles (length > 150 chars)...");

    // 1. Fetch EVERYTHING (Parents)
    const allItems = await client.fetchAllLibraryItems();
    const targets = allItems.filter(i => 
        i.data.itemType !== 'attachment' && 
        i.data.itemType !== 'note' &&
        (i.data.title && i.data.title.length > 150)
    );

    console.log(`Found ${targets.length} items with suspiciously long titles.`);

    for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        
        // Find filename from children
        const children = await client.getChildren(item.key);
        let fallbackTitle = "Recovered Item";
        const pdfChild = children.find(c => c.data.filename && c.data.filename.endsWith('.pdf'));
        
        if (pdfChild) {
            const fname = pdfChild.data.filename;
            fallbackTitle = fname.replace(/\.pdf$/i, "").replace(/[_\-\.]+/g, " ").trim();
            fallbackTitle = fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1);
        }

        console.log(`[${i+1}/${targets.length}] Trimming ${item.key}: '${item.data.title.substring(0, 50)}...' -> '${fallbackTitle}'`);
        
        try {
            await client.updateItem(item.key, {
                title: fallbackTitle,
                tags: (item.data.tags || []).concat([{ tag: "gefyra:trimmed" }, { tag: "gefyra:fixed" }])
            }, item.version);
        } catch (e: any) {
            console.error(`  [ERROR] Failed to update ${item.key}:`, e.message);
        }
        
        // Throttling
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 500));
    }
    
    console.log("Mass-Trim Complete!");
}

main();
