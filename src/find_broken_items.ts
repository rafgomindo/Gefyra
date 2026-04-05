import { ZoteroClient } from './zotero-client.js';
import * as fs from 'fs';

async function main() {
    const client = new ZoteroClient();
    console.log("Fetching full library to identify broken titles...");
    const items = await client.fetchAllLibraryItems();
    
    console.log(`Analyzing ${items.length} items...`);
    console.log("First 10 item titles for inspection:");
    items.slice(0, 10).forEach((it: any) => console.log(` - [${it.data.itemType}] ${it.data.title}`));

    // 1. Identify items with titles looking like filenames or lacking authors
    const brokenItems = items.filter((item: any) => {
        const title = (item.data.title || "").toLowerCase();
        const hasCreators = item.data.creators && item.data.creators.length > 0;
        
        // Match conditions:
        const isFilename = title.endsWith('.pdf') || title.endsWith('.docx') || title.endsWith('.epub');
        const hasUnderscores = title.includes('_') || title.includes(' - ') || title.includes('--');
        const isMostlyNumbers = /^[\d\s\-\.\#\(\)]+$/.test(title);
        const looksLikeRawFile = /^[a-z0-9_\- ]+\.[a-z]{3,4}$/.test(title);
        const lacksMetadata = !hasCreators && title.length > 0 && item.data.itemType !== 'note';

        return isFilename || hasUnderscores || isMostlyNumbers || looksLikeRawFile || lacksMetadata;
    });
    
    console.log(`Found ${brokenItems.length} candidate items with broken titles.`);
    
    // 2. Identify "Part" files and group them
    const partGroups: Record<string, string[]> = {};
    brokenItems.forEach((item: any) => {
        const title = item.data.title;
        const partMatch = title.match(/part\s*(\d+)/i) || title.match(/p\s*(\d+)/i);
        if (partMatch) {
            const baseName = title.replace(/part\s*\d+/i, '').replace(/p\s*\d+/i, '').trim();
            if (!partGroups[baseName]) partGroups[baseName] = [];
            partGroups[baseName].push(title);
        }
    });
    
    // 3. Save list for processing
    const results = {
        totalItems: items.length,
        brokenCount: brokenItems.length,
        brokenItems: brokenItems.map((m: any) => ({
            key: m.key,
            title: m.data.title,
            itemType: m.data.itemType,
            version: m.version
        })),
        partGroups
    };
    
    fs.writeFileSync('broken_items_audit.json', JSON.stringify(results, null, 2));
    console.log("Audit complete. Results saved to broken_items_audit.json");
    
    // 4. Summarize parts
    Object.entries(partGroups).forEach(([base, parts]) => {
        const sorted = parts.sort();
        console.log(`Group: "${base}" -> Found parts: ${sorted.join(', ')}`);
        if (!parts.some(p => p.toLowerCase().includes('part 1') || p.toLowerCase().includes('p 1'))) {
            console.log(`  [!] WARNING: Missing "Part 1" for group "${base}"`);
        }
    });
}

main().catch(console.error);
