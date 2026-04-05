import { ZoteroClient } from './zotero-client.js';
import * as fs from 'fs';

async function main() {
    const client = new ZoteroClient();
    const proposalsFile = './metadata_proposals.json';
    
    if (!fs.existsSync(proposalsFile)) {
        console.error("Proposals file missing. Analyze extraction results first.");
        process.exit(1);
    }
    
    const proposals = JSON.parse(fs.readFileSync(proposalsFile, 'utf8'));
    console.error(`Applying ${proposals.length} metadata fixes...`);
    
    for (const prop of proposals) {
        console.error(`--> Fix: ${prop.originalKey} -> "${prop.title}" (${prop.itemType})`);
        try {
            // 1. Create Parent
            const parentData: any = {
                itemType: prop.itemType,
                title: prop.title,
                creators: prop.creators,
                date: prop.date,
                tags: [{ tag: "gefyra:fixed-metadata" }]
            };
            
            const response = await client.createItem(parentData);
            const parentKey = response[0]?.key || response.successful?.["0"]?.key;
            
            if (!parentKey) {
                console.error("   Error: Created item key not returned.");
                continue;
            }
            
            console.error(`   Parent created: ${parentKey}. Reparenting attachment...`);
            
            // 2. Reparent attachment
            // If the original was already an attachment, prop.attachmentKey should be it
            const attachmentToMove = prop.attachmentKey || prop.originalKey;
            await client.reparentAttachment(attachmentToMove, parentKey);
            
            console.error(`   SUCCESS: ${attachmentToMove} is now under ${parentKey}`);
            
        } catch (err: any) {
            console.error(`   Failed to apply ${prop.originalKey}: ${err.message}`);
        }
    }
    
    console.error("Batch processing complete.");
    process.exit(0);
}

main().catch(console.error);
