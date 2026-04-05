import { ZoteroClient } from './zotero-client.js';
import { parseFilenameMetadata } from './utils.js';
import * as fs from 'fs';

async function main() {
    const client = new ZoteroClient();
    const auditFile = './broken_items_audit.json';
    const logFile = './tier1_execution.log';
    
    if (!fs.existsSync(auditFile)) {
        console.error("Audit file missing.");
        process.exit(1);
    }
    
    const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
    const brokenItems = auditData.brokenItems;
    
    // Process a slice (start, limit)
    const startIdx = parseInt(process.argv[2] || "0");
    const limit = parseInt(process.argv[3] || "50");
    
    // Filter for Tier 1 candidates in the entire list to keep global indices consistent?
    // No, better to just find the first N that match and are not already in log.
    const completedKeys = new Set(fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n') : []);
    
    console.error(`Starting Tier 1 Batch Fix (Limit: ${limit})...`);
    
    let processedCount = 0;
    for (const item of brokenItems) {
        if (processedCount >= limit) break;
        if (completedKeys.has(item.key)) continue;
        
        const metadata = parseFilenameMetadata(item.title);
        if (metadata) {
            console.error(`[${processedCount+1}/${limit}] Fixing: ${item.key} | ${item.title}`);
            try {
                // 1. Create Parent (Default: report)
                const parentData = {
                    itemType: "report",
                    title: metadata.title,
                    creators: metadata.creators,
                    date: metadata.date,
                    tags: [{ tag: "gefyra:fixed-metadata" }]
                };
                
                const response = await client.createItem(parentData);
                const parentKey = response[0]?.key || response.successful?.["0"]?.key;
                
                if (parentKey) {
                    // 2. Reparent attachment
                    await client.reparentAttachment(item.key, parentKey);
                    
                    // 3. Log success
                    fs.appendFileSync(logFile, `${item.key}\n`);
                    processedCount++;
                    console.error(`   SUCCESS: Child ${item.key} -> Parent ${parentKey}`);
                } else {
                    console.error(`   Fail: Could not get parent key.`);
                }
            } catch (err: any) {
                console.error(`   Fail: ${err.message}`);
            }
        }
    }
    
    console.error(`Batch complete. Processed ${processedCount} items.`);
    process.exit(0);
}

main().catch(console.error);
