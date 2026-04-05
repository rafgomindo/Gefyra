import fs from "node:fs";
import { ZoteroClient } from "./zotero-client.js";

async function main() {
    const proposals = JSON.parse(fs.readFileSync("rehabilitation_proposals.json", "utf-8"));
    const client = new ZoteroClient();
    
    // Filter to upgrades that are orphans
    const targets = proposals.filter((p: any) => p.orphan && p.action === "upgrade");
    console.error(`Total targets for rehabilitation: ${targets.length}`);

    // Process in batches of 25 (to be safe with Zotero API and timeouts)
    const BATCH_SIZE = 25;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        console.error(`Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`);
        
        for (const p of batch) {
            try {
                // IDEMPOTENCY CHECK
                const currentItem = await client.getItem(p.key);
                if (currentItem.data.parentItem && currentItem.data.parentItem !== "") {
                    console.error(`   [SKIP] Item ${p.key} already has a parent: ${currentItem.data.parentItem}`);
                    continue;
                }

                // 1. Create Parent Item
                const parentData = {
                    itemType: p.proposed.type || "journalArticle",
                    title: p.proposed.title,
                    creators: p.proposed.creators,
                    date: p.proposed.year,
                    tags: [{ tag: "gefyra:rehabilitated" }, { tag: "gefyra:auto" }]
                };
                
                const response: any = await client.createItem(parentData);
                const successful = response.successful;
                const newKey = successful ? (Object.values(successful)[0] as any)["key"] : null;

                if (newKey) {
                    console.error(`   [SUCCESS] Created parent ${newKey} for attachment ${p.key}`);
                    // 2. Reparent the attachment
                    await client.reparentAttachment(p.key, newKey as string);
                    console.error(`   [SUCCESS] Moved attachment ${p.key} under ${newKey}`);
                } else {
                    console.error(`   [FAILED] Failed to create parent for ${p.key}. Response: ${JSON.stringify(response)}`);
                }
            } catch (err: any) {
                console.error(`   [ERROR] Item ${p.key}: ${err.message}`);
            }
        }
    }
    
    console.error("Rehabilitation task completed.");
}

main().catch(err => {
    console.error(`Fatal error: ${err.message}`);
    process.exit(1);
});
