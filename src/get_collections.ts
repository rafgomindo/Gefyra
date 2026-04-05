import { ZoteroClient } from './zotero-client.js';

async function main() {
    const client = new ZoteroClient();
    console.error("Listing all collections...");
    const collections = await client.listCollections();
    console.log(JSON.stringify(collections, null, 2));
    process.exit(0);
}

main().catch(console.error);
