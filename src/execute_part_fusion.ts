import { ZoteroClient } from "./zotero-client.js";
import * as fs from "fs";

async function main() {
    const client = new ZoteroClient();
    const proposals = JSON.parse(fs.readFileSync("part_fusion_proposals.json", "utf-8"));
    
    console.log(`Starting PART-FUSION of ${proposals.length} groups...`);

    for (let i = 0; i < proposals.length; i++) {
        const group = proposals[i];
        const survivor = group.survivor;
        const extras = group.extras;

        console.log(`[${i+1}/${proposals.length}] Fusing parts for Master: '${survivor.title}'`);
        
        try {
            for (const extra of extras) {
                const children = await client.getChildren(extra.key);
                for (const child of children) {
                    console.log(`    Moving part ${child.key} ('${child.data.title || child.data.filename}') -> Master ${survivor.key}`);
                    await client.reparentAttachment(child.key, survivor.key);
                }
                
                console.log(`  Deleting shell ${extra.key}...`);
                await client.deleteItem(extra.key, extra.version);
            }
            
            await client.updateItem(survivor.key, {
                tags: (survivor.data.tags || []).concat([{ tag: "gefyra:parts-fused" }, { tag: "gefyra:fixed" }])
            }, survivor.version);

        } catch (e: any) {
            console.error(`  [ERROR] Failed to fuse group ${survivor.key}:`, e.message);
        }

        // Throttling for these large merges
        await new Promise(r => setTimeout(r, 800));
    }
    
    console.log("Part-Fusion Complete!");
}

main();
