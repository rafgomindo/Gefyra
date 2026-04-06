import axios, { AxiosInstance } from "axios";
import process from "node:process";
import { createRequire } from "node:module";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export interface ZoteroItem {
  key: string;
  version: number;
  data: any;
  meta: any;
}

export class ZoteroClient {
  private localClient: AxiosInstance | null = null;
  private cloudClient: AxiosInstance | null = null;
  private userId: string;
  private apiKey: string;

  constructor() {
    this.userId = (process.env.ZOTERO_USER_ID || "").trim();
    this.apiKey = (process.env.ZOTERO_API_KEY || "").trim();
    const localURL = (process.env.ZOTERO_LOCAL_URL || "http://localhost:23119").trim();
    const cloudURL = (process.env.ZOTERO_CLOUD_URL || "https://api.zotero.org").trim();

    // Initialize Local Client
    this.localClient = axios.create({
      baseURL: localURL,
      timeout: 3000, 
      headers: {
        "Zotero-API-Version": "3",
      },
    });

    // Initialize Cloud Client if credentials exist
    if (this.apiKey) {
      this.cloudClient = axios.create({
        baseURL: cloudURL,
        headers: {
          "Zotero-API-Key": this.apiKey,
          "Zotero-API-Version": "3",
        },
      });
    }
  }

  /**
   * Helper that attempts a request on the Local library first, then falls back to Cloud.
   */
  private async request(method: string, url: string, config: any = {}): Promise<any> {
    const { data, ...axiosConfig } = config;
    const isCloudSearch = axiosConfig.params && (axiosConfig.params.limit > 50 || axiosConfig.params.qmode);

    // 1. Try Local (READ operations ONLY)
    if (this.localClient && method.toLowerCase() === "get" && !isCloudSearch) {
      try {
        const localUrl = url.replace(new RegExp(`^/users/${this.userId}`), "");
        const response = await (this.localClient as any)[method.toLowerCase()](localUrl, axiosConfig);
        return response.data;
      } catch (error: any) {
        // Fallback to cloud silent
      }
    }

    // 2. Try Cloud
    if (this.cloudClient) {
      try {
        console.error(`Attempting Cloud Request: ${method.toUpperCase()} ${url}`);
        const axiosMethod = method.toLowerCase();
        let response;
        if (axiosMethod === "get" || axiosMethod === "delete") {
          response = await (this.cloudClient as any)[axiosMethod](url, axiosConfig);
        } else {
          response = await (this.cloudClient as any)[axiosMethod](url, data, axiosConfig);
        }
        return response.data;
      } catch (error: any) {
        this.handleApiError(error, `${method.toUpperCase()} ${url}`);
      }
    }

    throw new Error("No Zotero library available (Local and Cloud both failed or are not configured).");
  }

  private handleApiError(error: any, context: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const detail = JSON.stringify(error.response.data, null, 2);
        console.error(`VERBOSE ERROR for ${context}: ${detail}`);
        let message = `Cloud Zotero API request for ${context} failed with status ${error.response.status}: ${detail}`;
        throw new Error(message);
      } else if (error.request) {
        throw new Error(`Cloud Zotero API request for ${context} failed. No response received.`);
      }
      throw new Error(`Network error during ${context}: ${error.message}`);
    }
    throw new Error(`Unexpected error during ${context}: ${(error as Error).message}`);
  }

  /**
   * Search for items in the library.
   * @param query The search query string.
   * @param collectionKey Optional collection key to filter search.
   */
  /**
   * Search for items in the library with pagination support.
   * @param query The search query string.
   * @param collectionKey Optional collection key to filter search.
   * @param start The offset to start from.
   * @param limit The maximum number of items to return.
   */
  async searchItems(query: string, collectionKey?: string, start = 0, limit = 50): Promise<ZoteroItem[]> {
    const params: any = {
      format: "json", // Minimalist config
      start,
      limit,
    };

    if (query && query.trim() !== "") {
      params.q = query;
    }

    const url = collectionKey
      ? `/users/${this.userId}/collections/${collectionKey}/items`
      : `/users/${this.userId}/items`;

    return this.request("get", url, { params });
  }

  /**
   * Fetch ALL items from the entire library or a specific collection using recursive pagination.
   */
  async fetchAllLibraryItems(collectionKey?: string): Promise<ZoteroItem[]> {
    const allItems: ZoteroItem[] = [];
    let start = 0;
    const limit = 100; // Efficient batch size

    while (true) {
      const batch = await this.searchItems("", collectionKey, start, limit);
      if (batch.length === 0) break;
      allItems.push(...batch);
      start += batch.length;
      if (batch.length < limit) break; // Reached end
    }

    console.error(`Fetched ${allItems.length} total items from library.`);
    return allItems;
  }

  /**
   * Fetch all children of a given item.
   * @param itemKey The parent item key.
   */
  async getChildren(itemKey: string): Promise<ZoteroItem[]> {
    const url = `/users/${this.userId}/items/${itemKey}/children`;
    return this.request("get", url);
  }

  /**
   * Delete a single item (or multiple).
   */
  async deleteItem(itemKey: string, version?: number): Promise<any> {
    const url = `/users/${this.userId}/items/${itemKey}`;
    const config: any = {};
    if (version) {
      config.headers = { "If-Unmodified-Since-Version": version.toString() };
    }
    return this.request("delete", url, config);
  }

  /**
   * Fetch ALL items explicitly from the Trash.
   */
  async fetchTrashItems(): Promise<ZoteroItem[]> {
    const allItems: ZoteroItem[] = [];
    let start = 0;
    const limit = 100;

    while (true) {
      // Correct Zotero Cloud V3 parameters: trashed=1
      const url = `/users/${this.userId}/items`;
      const batch = await this.request("get", url, { 
        params: { 
          trashed: 1, 
          start, 
          limit, 
          format: "json",
          include: "data"
        } 
      });
      
      if (!batch || batch.length === 0) break;
      allItems.push(...batch);
      start += batch.length;
      if (batch.length < limit) break;
    }

    console.error(`Status: Identified ${allItems.length} items currently in the Zotero Trash.`);
    return allItems;
  }

  /**
   * Diagnostic: Fetch counts from ALL endpoints to find where items are "hiding".
   */
  async diagnosticScan() {
    console.error("DEBUG: Starting Global Inventory Scan...");
    
    const results: any = {};
    
    try {
      // 1. Regular items count
      const items = await this.request("get", `/users/${this.userId}/items`, { params: { limit: 1 } });
      results.activeCount = items.length;
    } catch (e) {}

    try {
      // 2. Trash items count
      const trash = await this.request("get", `/users/${this.userId}/items`, { params: { trashed: 1, limit: 1 } });
      results.trashCount = trash.length;
    } catch (e) {}

    try {
      // 3. Recently deleted logs
      const deleted = await this.request("get", `/users/${this.userId}/deleted`);
      results.deletedLogsSize = JSON.stringify(deleted).length;
    } catch (e) {}

    console.error(`SCAN COMPLETE: Active=${results.activeCount}, Trashed=${results.trashCount}, DeletedLogs(Chars)=${results.deletedLogsSize}`);
    return results;
  }

  /**
   * Get metadata for a specific item.
   * @param itemId The unique Zotero item key.
   */
  async getItem(itemId: string): Promise<ZoteroItem> {
    return this.request("get", `/users/${this.userId}/items/${itemId}`, {
      params: {
        format: "json",
      },
    });
  }

  /**
   * List collections in the library.
   */
  async listCollections() {
    return this.request("get", `/users/${this.userId}/collections`, {
      params: {
        format: "json",
      },
    });
  }

  /**
   * List all tags in the library.
   */
  async listTags() {
    return this.request("get", `/users/${this.userId}/tags`, {
      params: {
        format: "json",
      },
    });
  }

  /**
   * Get hierarchical collection tree.
   */
  async getCollectionTree() {
    const collections = await this.listCollections();
    const tree: any[] = [];
    const lookup: any = {};

    collections.forEach((c: any) => {
      lookup[c.key] = { ...c, children: [] };
    });

    collections.forEach((c: any) => {
      if (c.data.parentCollection && lookup[c.data.parentCollection]) {
        lookup[c.data.parentCollection].children.push(lookup[c.key]);
      } else {
        tree.push(lookup[c.key]);
      }
    });

    return tree;
  }

  /**
   * Get high-level library statistics.
   */
  async getLibraryStats() {
    const results: any = {
      items: 0,
      collections: 0,
      tags: 0,
      trash: 0
    };

    try {
      const items = await this.request("get", `/users/${this.userId}/items`, { params: { limit: 1 } });
      results.items = items.length > 0 ? parseInt(items[0].version) : 0; 
    } catch (e) {}

    const collections = await this.listCollections();
    results.collections = collections.length;

    const tags = await this.listTags();
    results.tags = tags.length;

    const trash = await this.fetchTrashItems();
    results.trash = trash.length;

    return results;
  }

  /**
   * Get BibTeX for a specific item.
   * @param itemId The unique Zotero item key.
   */
  async getBibTeX(itemId: string): Promise<string> {
    return this.request("get", `/users/${this.userId}/items/${itemId}`, {
      params: {
        format: "bibtex",
      },
    });
  }

  /**
   * Get children items for a specific item (e.g., attachments).
   * @param itemId The unique Zotero item key.
   */
  async getItemChildren(itemId: string): Promise<ZoteroItem[]> {
    return this.request("get", `/users/${this.userId}/items/${itemId}/children`, {
      params: {
        format: "json",
      },
    });
  }

  /**
   * Extract text from the first PDF attachment of a Zotero item.
   * @param itemId The unique Zotero item key.
   */
  async getAttachmentText(itemId: string): Promise<string> {
    try {
      const children = await this.getItemChildren(itemId);
      const pdfAttachment = children.find(
        (c) => c.data.itemType === "attachment" && c.data.contentType === "application/pdf"
      );

      if (!pdfAttachment) {
        throw new Error("No PDF attachment found for this item");
      }

      // Download file - use request handler for failover
      const response = await this.client_for_file_download(pdfAttachment.key);
      const buffer = Buffer.from(response);
      const data = await pdf(buffer);
      return data.text;
    } catch (error: any) {
      throw new Error(`Failed to extract PDF text for item '${itemId}': ${error.message}`);
    }
  }

  /**
   * Specialized request for file downloads (binary data).
   */
  public async client_for_file_download(itemKey: string): Promise<any> {
    const url = `/users/${this.userId}/items/${itemKey}/file`;
    const config: any = { responseType: "arraybuffer" };

    // Try Local
    if (this.localClient) {
      try {
        const response = await this.localClient.get(url, config);
        return response.data;
      } catch (error) {
        console.error("Local PDF download failed. Trying cloud...");
      }
    }

    // Try Cloud
    if (this.cloudClient) {
      const response = await this.cloudClient.get(url, config);
      return response.data;
    }

    throw new Error("No client available for file download.");
  }

  /**
   * Add a research note to a specific item.
   * @param parentItemId The unique Zotero item key to attach the note to.
   * @param noteContent The HTML/text content of the note.
   */
  async addNote(parentItemId: string, noteContent: string): Promise<ZoteroItem> {
    const note = [
      {
        itemType: "note",
        parentItem: parentItemId,
        note: noteContent,
        tags: [{ tag: "gefyra-ai" }],
      },
    ];

    return this.request("post", `/users/${this.userId}/items`, note);
  }

  /**
   * Retrieve the citation key (Better BibTeX) or create a standard one.
   * @param itemId The unique Zotero item key.
   */
  async getCiteKey(itemId: string): Promise<string> {
    try {
      const item = await this.getItem(itemId);
      const extraFields = item.data.extra || "";
      const match = extraFields.match(/citationKey:\s*([^\s]+)/);
      
      if (match) return match[1];
      
      // Fallback: simple slug generator
      const creator = item.data.creators?.[0]?.lastName || "Unknown";
      const year = (item.data.date || "0000").substring(0, 4);
      return `${creator}${year}`;
    } catch (error: any) {
      throw new Error(`Getting citation key failed: ${error.message}`);
    }
  }

  /**
   * Create a new item in the library.
   * @param itemData The JSON representation of the new item.
   */
  async createItem(itemData: any): Promise<any> {
    return this.request("post", `/users/${this.userId}/items`, {
      data: Array.isArray(itemData) ? itemData : [itemData],
    });
  }

  /**
   * Update an existing item (Patch).
   * @param itemKey The unique Zotero item key.
   * @param updates The fields to update.
   * @param version The current version of the item (for concurrency control).
   */
  async updateItem(itemKey: string, updates: any, version?: number): Promise<any> {
    const headers: any = {};
    if (version !== undefined) {
      // Zotero Cloud V3 uses If-Unmodified-Since-Version for key-based writes
      headers["If-Unmodified-Since-Version"] = version.toString();
    }
    
    return this.request("patch", `/users/${this.userId}/items/${itemKey}`, {
      data: updates,
      headers,
    });
  }

  /**
   * Move an item to the trash.
   * @param itemKey The unique Zotero item key.
   * @param version The current version of the item (for concurrency control).
   */
  async trashItem(itemKey: string, version?: number): Promise<any> {
    // To trash an item, we update its 'deleted' property to 1
    // Zotero Cloud requires the version in the data and the If-Unmodified-Since-Version header
    const data: any = { deleted: 1 };
    
    const headers: any = {};
    if (version !== undefined) {
      headers["If-Unmodified-Since-Version"] = version.toString();
    }
    
    return this.request("patch", `/users/${this.userId}/items/${itemKey}`, {
      data,
      headers,
    });
  }

  /**
   * Add tags to an existing item.
   * @param itemKey The unique Zotero item key.
   * @param tags Array of tag strings.
   */
  async addTags(itemKey: string, tags: string[]): Promise<any> {
    const item = await this.getItem(itemKey);
    const existingTags = item.data.tags || [];
    const newTags = [...existingTags];
    
    tags.forEach(tag => {
      if (!newTags.find(t => t.tag === tag)) {
        newTags.push({ tag });
      }
    });

    return this.updateItem(itemKey, { tags: newTags }, item.version);
  }

  /**
   * Create a new collection.
   * @param name Name of the collection.
   * @param parentKey Optional parent collection key.
   */
  async createCollection(name: string, parentKey?: string): Promise<any> {
    const data: any = { name };
    if (parentKey) {
      data.parentCollection = parentKey;
    }
    
    return this.request("post", `/users/${this.userId}/collections`, {
      data: [data],
    });
  }

  /**
   * Move an attachment item under a new parent item.
   * @param attachmentKey The unique Zotero key of the attachment to move.
   * @param parentKey The unique Zotero key of the new parent item.
   */
  async reparentAttachment(attachmentKey: string, parentKey: string): Promise<any> {
    const item = await this.getItem(attachmentKey);
    return this.updateItem(attachmentKey, { parentItem: parentKey }, item.version);
  }

  /**
   * Upload a local file to Zotero and attach it to a parent item.
   * @param parentKey The key of the parent item.
   * @param filePath The local path to the file.
   * @param filename Optional filename (defaults to local basename).
   */
  async uploadFile(parentKey: string, filePath: string, filename?: string): Promise<any> {
    const name = filename || path.basename(filePath);
    const fileStats = await stat(filePath);
    const fileBuffer = await readFile(filePath);
    const md5 = createHash("md5").update(fileBuffer).digest("hex");
    const mtime = Math.floor(fileStats.mtimeMs);

    // 1. Create the attachment item
    const attachmentItem = {
      itemType: "attachment",
      parentItem: parentKey,
      linkMode: "imported_file",
      title: name,
      filename: name,
      contentType: this.getMimeType(name),
    };

    const createResponse = await this.createItem(attachmentItem);
    const attachmentKey = createResponse.successful["0"].key;

    // 2. Get upload authorization
    const authUrl = `/users/${this.userId}/items/${attachmentKey}/file`;
    const authData = `md5=${md5}&filename=${encodeURIComponent(name)}&filesize=${fileStats.size}&mtime=${mtime}`;
    
    const authResponse = await this.request("post", authUrl, {
      data: authData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "If-None-Match": "*",
      },
      params: { params: 1 }
    });

    if (authResponse.exists) {
      console.error(`File already exists in Zotero for item ${attachmentKey}.`);
      return { attachmentKey, status: "exists" };
    }

    // 3. Perform the upload to the provided URL (e.g. S3)
    const { url, uploadKey, params } = authResponse;
    const formData = new URLSearchParams();
    
    // Zotero expects parameters from authResponse to be sent in the form
    // We'll use a multipart/form-data approach or whatever Zotero docs specify
    // Actually, when params=1 is used, we get an array of parameters.
    
    // We need to use axios to POST to the URL with the file content
    // The Zotero documentation says: "Concatenate prefix, file contents, and suffix and POST..."
    // But with params=1, we should send them as form fields.
    
    const uploadForm = new (createRequire(import.meta.url)("form-data"))();
    for (const [key, value] of Object.entries(params)) {
      uploadForm.append(key, value);
    }
    uploadForm.append("file", fileBuffer, { filename: name });

    await axios.post(url, uploadForm, {
      headers: uploadForm.getHeaders()
    });

    // 4. Register the upload
    const registerResponse = await this.request("post", authUrl, {
      data: `upload=${uploadKey}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "If-None-Match": "*",
      }
    });

    return { attachmentKey, status: "uploaded" };
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const map: Record<string, string> = {
      ".pdf": "application/pdf",
      ".epub": "application/epub+zip",
      ".zip": "application/zip",
      ".txt": "text/plain",
      ".html": "text/html",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".jpg": "image/jpeg",
      ".png": "image/png",
    };
    return map[ext] || "application/octet-stream";
  }

  /**
   * Fuse (merge) multiple items into one.
   * All children from 'extraKeys' will be moved to 'survivorKey'.
   * The 'extraKeys' items will then be moved to trash.
   * @param survivorKey The key of the item that will remain.
   * @param extraKeys List of keys of items to be merged into the survivor.
   */
  async fuseItems(survivorKey: string, extraKeys: string[]): Promise<any> {
    const survivor = await this.getItem(survivorKey);
    const results = [];

    for (const extraKey of extraKeys) {
      try {
        const extra = await this.getItem(extraKey);
        const children = await this.getChildren(extraKey);

        for (const child of children) {
          await this.reparentAttachment(child.key, survivorKey);
        }

        await this.trashItem(extraKey, extra.version);
        results.push({ key: extraKey, status: "fused" });
      } catch (e: any) {
        results.push({ key: extraKey, status: "failed", error: e.message });
      }
    }

    // Tag the survivor
    await this.updateItem(survivorKey, {
      tags: (survivor.data.tags || []).concat([
        { tag: "gefyra:fused" },
        { tag: "gefyra:master" }
      ])
    }, survivor.version);

    return { survivorKey, extras: results };
  }

  /**
   * Associate two items. 
   * Supports 'reparent' (make child of) or 'link' (make related items).
   * @param itemA The primary item key.
   * @param itemB The secondary item key (child or related item).
   * @param type 'reparent' (itemB becomes child of itemA) or 'link' (bilateral relationship).
   */
  async associateItems(itemA: string, itemB: string, type: "reparent" | "link"): Promise<any> {
    if (type === "reparent") {
      return this.reparentAttachment(itemB, itemA);
    } else {
      // Zotero bilateral relations
      const item1 = await this.getItem(itemA);
      const item2 = await this.getItem(itemB);

      const rel1 = item1.data.relations || {};
      const rel2 = item2.data.relations || {};

      const sameAs = "owl:sameAs";
      const uri1 = `http://zotero.org/users/${this.userId}/items/${itemA}`;
      const uri2 = `http://zotero.org/users/${this.userId}/items/${itemB}`;

      // Add mutual links
      rel1[sameAs] = rel1[sameAs] ? (Array.isArray(rel1[sameAs]) ? [...rel1[sameAs], uri2] : [rel1[sameAs], uri2]) : uri2;
      rel2[sameAs] = rel2[sameAs] ? (Array.isArray(rel2[sameAs]) ? [...rel2[sameAs], uri1] : [rel2[sameAs], uri1]) : uri1;

      await this.updateItem(itemA, { relations: rel1 }, item1.version);
      await this.updateItem(itemB, { relations: rel2 }, item2.version);

      return { status: "linked", items: [itemA, itemB] };
    }
  }
}
