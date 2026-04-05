import { ZoteroClient } from "./zotero-client.js";
import * as fs from "fs";

async function main() {
    const client = new ZoteroClient();
    const audit = JSON.parse(fs.readFileSync("deep_orphan_audit.json", "utf-8"));
    
    console.log(`Applying Deep Orphan Fixes to ${audit.length} items...`);

    for (let i = 0; i < audit.length; i++) {
        const item = audit[i];
        const ck = item.key;
        const filename = item.filename;
        const title = filename.replace(/\.pdf$/i, "").replace(/[_\-\.]+/g, " ").trim().charAt(0).toUpperCase() + filename.replace(/\.pdf$/i, "").replace(/[_\-\.]+/g, " ").trim().slice(1);
        
        console.log(`[${i+1}/${audit.length}] fixing ${ck}: '${filename}' -> '${title}'`);
        
        try {
            // Create Parent
            const newParent = await client.createItem({
                itemType: "journalArticle",
                title: title,
                tags: [{ tag: "gefyra:deep-clean" }, { tag: "gefyra:fixed" }]
            });
            const newParentKey = newParent.successful["0"].key;
            
            // Re-parent
            await client.reparentAttachment(ck, newParentKey);
        } catch (e: any) {
            console.error(`  [ERROR] Failed to fix ${ck}:`, e.message);
        }
    }
}

main();
