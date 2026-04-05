import { ZoteroClient } from "./zotero-client.js";
import * as fs from "fs";

async function main() {
    const client = new ZoteroClient();
    const proposals = JSON.parse(fs.readFileSync("duplicate_fusion_proposals.json", "utf-8"));
    
    console.log(`Starting Fusion of ${proposals.length} duplicate groups...`);

    for (let i = 0; i < proposals.length; i++) {
        const group = proposals[i];
        const survivor = group.survivor;
        const extras = group.extras;

        console.log(`[${i+1}/${proposals.length}] Fusing duplicates for: '${survivor.title}'`);
        
        try {
            // 1. Move all children to survivor
            for (const extra of extras) {
                console.log(`  Moving children from extra ${extra.key} -> ${survivor.key}`);
                
                // Get all children of this extra
                const children = await client.getChildren(extra.key);
                for (const child of children) {
                    console.log(`    Reparenting child ${child.key} ('${child.data.title || child.data.filename}')`);
                    await client.reparentAttachment(child.key, survivor.key);
                }
                
                // 2. Delete the now-empty extra parent
                console.log(`  Deleting empty extra ${extra.key}...`);
                await client.deleteItem(extra.key, extra.version);
            }
            
            // 3. Mark survivor as fused
            await client.updateItem(survivor.key, {
                tags: (survivor.data.tags || []).concat([{ tag: "gefyra:fused" }, { tag: "gefyra:fixed" }])
            }, survivor.version);

        } catch (e: any) {
            console.error(`  [ERROR] Failed to fuse group ${survivor.key}:`, e.message);
        }

        // Throttling
        await new Promise(r => setTimeout(r, 500));
    }
    
    console.log("Fusion Operation Complete!");
}

main();
