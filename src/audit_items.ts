import { ZoteroClient } from './zotero-client.js';

async function main() {
    const client = new ZoteroClient();
    console.log("Fetching library...");
    const items = await client.fetchAllLibraryItems();
    
    const targets = ["Frontex", "GARCÍA_BRENES", "García Brenes", "Balandier"];
    
    const matches = items.filter((item: any) => {
        const title = (item.data.title || "").toLowerCase();
        return targets.some(t => title.includes(t.toLowerCase()));
    });
    
    console.log(`Found ${matches.length} matching items:`);
    matches.forEach(m => {
        console.log(JSON.stringify({
            key: m.key,
            itemType: m.data.itemType,
            title: m.data.title,
            numCreators: m.data.creators ? m.data.creators.length : 0,
            date: m.data.date
        }, null, 2));
    });
}

main().catch(console.error);
