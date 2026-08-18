import { test } from "node:test";
import assert from "node:assert/strict";
import { ZoteroClient } from "./zotero-client.js";

test("read-only mode blocks write operations before any network call", async () => {
  process.env.GEFYRA_READ_ONLY = "true";
  process.env.ZOTERO_USER_ID = "12345";
  delete process.env.ZOTERO_API_KEY;

  const client = new ZoteroClient();
  assert.equal(client.readOnly, true);

  await assert.rejects(() => client.trashItem("ABC123"), /read-only mode/);
  await assert.rejects(() => client.updateItem("ABC123", { title: "x" }), /read-only mode/);
  await assert.rejects(() => client.createItem({ itemType: "note" }), /read-only mode/);
  await assert.rejects(() => client.deleteItem("ABC123"), /read-only mode/);
  await assert.rejects(() => client.addTags("ABC123", ["x"]), /read-only mode/);
  await assert.rejects(() => client.batchUpdateItems([{ key: "ABC123", updates: {} }]), /read-only mode/);

  delete process.env.GEFYRA_READ_ONLY;
});

test("read-only mode defaults to false when unset", () => {
  delete process.env.GEFYRA_READ_ONLY;
  process.env.ZOTERO_USER_ID = "12345";

  const client = new ZoteroClient();
  assert.equal(client.readOnly, false);
});
