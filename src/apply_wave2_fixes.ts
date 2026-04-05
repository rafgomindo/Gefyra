import { ZoteroClient } from "./zotero-client.js";
import * as fs from "fs";

async function main() {
    const client = new ZoteroClient();
    const proposals = JSON.parse(fs.readFileSync("wave2_rehabilitation_proposals.json", "utf-8"));
    
    console.log(`Applying ${proposals.length} Wave 2 repairs (Leftover Metadata Only)...`);

    for (let i = 0; i < proposals.length; i++) {
        const p = proposals[i];
        console.log(`[${i+1}/${proposals.length}] Patching ${p.key}: '${p.current}' -> '${p.proposed}' (${p.source})`);
        
        try {
            await client.updateItem(p.key, { 
                title: p.proposed,
                tags: [{ tag: "gefyra:wave2" }, { tag: "gefyra:fixed" }]
            }, p.version);
        } catch (e: any) {
            console.error(`  [ERROR] Failed to patch ${p.key}:`, e.message);
        }
        
        // Anti-throttle pause
        if (i > 0 && i % 10 === 0) {
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

main();
