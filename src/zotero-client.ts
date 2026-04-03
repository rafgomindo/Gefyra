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

  constructor() {
    this.userId = process.env.ZOTERO_USER_ID || "7679932";
    const apiKey = process.env.ZOTERO_API_KEY;
    const localURL = process.env.ZOTERO_LOCAL_URL || "http://localhost:23119";
    const cloudURL = process.env.ZOTERO_CLOUD_URL || "https://api.zotero.org";

    // Initialize Local Client
    this.localClient = axios.create({
      baseURL: localURL,
      timeout: 3000, 
      headers: {
        "Zotero-API-Version": "3",
      },
    });

    // Initialize Cloud Client if credentials exist
    if (this.userId && apiKey) {
      this.cloudClient = axios.create({
        baseURL: cloudURL,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Zotero-API-Version": "3",
        },
      });
    }
  }

  /**
   * Helper that attempts a request on the Local library first, then falls back to Cloud.
   */
  private async request(method: "get" | "post", url: string, config: any = {}): Promise<any> {
    // 1. Try Local
    if (this.localClient) {
      try {
        // Strip out the /users/ID prefix for local Zotero calls
        const localUrl = url.replace(new RegExp(`^/users/${this.userId}`), "");
        console.error(`Attempting local request: ${method.toUpperCase()} ${localUrl}`);
        const response = await (this.localClient as any)[method](localUrl, config);
        return response.data;
      } catch (error: any) {
        console.error(`Local Zotero request failed: ${error.message} (${url}). Falling back to Cloud...`);
      }
    }

    // 2. Try Cloud
    if (this.cloudClient) {
      try {
        console.error(`Attempting cloud request: ${method.toUpperCase()} ${url}`);
        const response = await (this.cloudClient as any)[method](url, config);
        return response.data;
      } catch (error: any) {
        this.handleApiError(error, `Cloud request to ${url}`);
      }
    }

    throw new Error("No Zotero library available (Local and Cloud both failed or are not configured).");
  }

  private handleApiError(error: any, context: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        let message = `Cloud Zotero API request for ${context} failed with status ${error.response.status}.`;
        if (error.response.status === 404) {
          message += ` Check your User ID ('${this.userId}') or Item ID.`;
        } else if (error.response.status === 403 || error.response.status === 401) {
          message += ` Check your API Key permissions.`;
        }
        throw new Error(message);
      } else if (error.request) {
        throw new Error(`Cloud Zotero API request for ${context} failed. No response received.`);
      }
    }
    throw new Error(`Unexpected error during ${context}: ${(error as Error).message}`);
  }

  /**
   * Search for items in the library.
   * @param query The search query string.
   */
  async searchItems(query: string): Promise<ZoteroItem[]> {
    return this.request("get", `/users/${this.userId}/items`, {
      params: {
        q: query,
        format: "json",
        include: "data,meta",
      },
    });
  }

  /**
   * Get metadata for a specific item.
   * @param itemId The unique Zotero item key.
   */
  async getItem(itemId: string): Promise<ZoteroItem> {
    return this.request("get", `/users/${this.userId}/items/${itemId}`, {
      params: {
        format: "json",
        include: "data,meta",
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
        include: "data,meta",
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
  private async client_for_file_download(itemKey: string): Promise<any> {
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
}
