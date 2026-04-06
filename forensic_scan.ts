import { ZoteroClient } from "./src/zotero-client.js";

async function forensic() {
  const client = new ZoteroClient();
  try {
    console.error("Starting Zotero Forensic Scan...");
    
    // 1. Check Root Items
    const rootCount = await (client as any).request("get", `/users/7679932/items`, {
      params: { limit: 1 }
    });
    console.error(`Status Root Items: ${JSON.stringify(rootCount, null, 2)}`);
    
    // 2. Check Trash explicitly
    const trashItems = await (client as any).request("get", `/users/7679932/items`, {
      params: { filter: "trash", limit: 10 }
    });
    console.error(`Status Trash: Found ${trashItems.length} items.`);

    // 3. Search for a known-missing item if we have one
    // Let's just fetch everything without any filter to see what's in the stream
    const rawItems = await (client as any).request("get", `/users/7679932/items`, {
      params: { limit: 100, format: "json" }
    });
    console.error(`First 100 items raw metadata review: Recovered ${rawItems.length} items in stream.`);
    if (rawItems.length > 0) {
       rawItems.slice(0, 5).forEach(i => console.error(` - ${i.key}: deleted=${i.deleted}, title=${i.data.title}`));
    }
  } catch (err) {
    console.error("Forensic scan failed:", err.message);
  }
}

forensic();
