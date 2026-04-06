import { ZoteroClient } from "../build/zotero-client.js";

async function test() {
  try {
    const client = new ZoteroClient();
    console.log("Client initialized.");
    
    // Check if method exists
    if (typeof client.listTags === 'function') {
      console.log("SUCCESS: listTags method found in compiled JS.");
    } else {
      console.log("FAILURE: listTags method NOT found in compiled JS.");
    }

    if (typeof client.getLibraryStats === 'function') {
      console.log("SUCCESS: getLibraryStats method found in compiled JS.");
    }

    if (typeof client.getCollectionTree === 'function') {
      console.log("SUCCESS: getCollectionTree method found in compiled JS.");
    }

  } catch (err) {
    console.error("Test Error:", err.message);
  }
}

test();
