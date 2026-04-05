import { ZoteroClient } from './zotero-client.js';

async function main() {
    const client = new ZoteroClient();
    const key = process.argv[2] || "VNFXU58J";
    try {
        const item = await client.getItem(key);
        console.log(JSON.stringify(item.data, null, 2));
    } catch (e: any) {
        console.error(e.message);
    }
}
main();
