import { ZoteroClient } from "./src/zotero-client.js";

async function diagnostic() {
  const client = new ZoteroClient();
  try {
    console.error("Checking Zotero Trash...");
    // Special request for trash
    const trashItems = await (client as any).request("get", `/users/7679932/items`, {
      params: { filter: "trash", format: "json", limit: 100 }
    });
    console.error(`Found ${trashItems.length} items in the top batch of Trash.`);
    if (trashItems.length > 0) {
      console.error("First 3 items in Trash:");
      trashItems.slice(0, 3).forEach(i => console.error(` - ${i.key}: ${i.data.title || "(No Title)"}`));
    }
  } catch (err) {
    console.error("Diagnostic failed:", err.message);
  }
}

diagnostic();
