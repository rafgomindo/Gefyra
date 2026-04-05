import axios, { AxiosInstance } from "axios";
import process from "node:process";
import { createRequire } from "node:module";

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
    this.userId = (process.env.ZOTERO_USER_ID || "7679932").trim();
    this.apiKey = (process.env.ZOTERO_API_KEY || "mGvqRaKVSavhQqD2RQh1vL9A").trim();
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
}
