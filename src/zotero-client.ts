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
  private client: AxiosInstance;
  private userId: string;

  constructor() {
    const userId = process.env.ZOTERO_USER_ID;
    const apiKey = process.env.ZOTERO_API_KEY;

    if (!userId) {
      throw new Error("ZOTERO_USER_ID environment variable is not set");
    }
    if (!apiKey) {
      throw new Error("ZOTERO_API_KEY environment variable is not set");
    }

    this.userId = userId;
    this.client = axios.create({
      baseURL: "https://api.zotero.org",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Zotero-API-Version": "3",
      },
    });
  }

  private handleApiError(error: any, context: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        let message = `Zotero API request for ${context} failed with status ${error.response.status}.`;
        if (error.response.status === 404) {
          message += ` This may mean the ZOTERO_USER_ID ('${this.userId}') or the specific item ID is incorrect.`;
        } else if (error.response.status === 403 || error.response.status === 401) {
          message += ` This may mean your ZOTERO_API_KEY is invalid or lacks permissions.`;
        }
        throw new Error(message);
      } else if (error.request) {
        throw new Error(
          `Zotero API request for ${context} failed. No response received. Check your network connection to api.zotero.org.`
        );
      }
    }
    throw new Error(`An unexpected error occurred during ${context}: ${(error as Error).message}`);
  }

  /**
   * Search for items in the user's library.
   * @param query The search query string.
   */
  async searchItems(query: string): Promise<ZoteroItem[]> {
    try {
      const response = await this.client.get(`/users/${this.userId}/items`, {
        params: {
          q: query,
          format: "json",
          include: "data,meta",
        },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `searching for items with query '${query}'`);
    }
  }

  /**
   * Get metadata for a specific item.
   * @param itemId The unique Zotero item key.
   */
  async getItem(itemId: string): Promise<ZoteroItem> {
    try {
      const response = await this.client.get(`/users/${this.userId}/items/${itemId}`, {
        params: {
          format: "json",
          include: "data,meta",
        },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `getting item '${itemId}'`);
    }
  }

  /**
   * List collections in the user's library.
   */
  async listCollections() {
    try {
      const response = await this.client.get(`/users/${this.userId}/collections`, {
        params: {
          format: "json",
        },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, "listing collections");
    }
  }

  /**
   * Get BibTeX for a specific item.
   * @param itemId The unique Zotero item key.
   */
  async getBibTeX(itemId: string): Promise<string> {
    try {
      const response = await this.client.get(`/users/${this.userId}/items/${itemId}`, {
        params: {
          format: "bibtex",
        },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `getting BibTeX for item '${itemId}'`);
    }
  }

  /**
   * Get children items for a specific item (e.g., attachments).
   * @param itemId The unique Zotero item key.
   */
  async getItemChildren(itemId: string): Promise<ZoteroItem[]> {
    try {
      const response = await this.client.get(`/users/${this.userId}/items/${itemId}/children`, {
        params: {
          format: "json",
          include: "data,meta",
        },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `getting children for item '${itemId}'`);
    }
  }

  /**
   * Extract text from the first PDF attachment of a Zotero item.
   * @param itemId The unique Zotero item key.
   */
  async getAttachmentText(itemId: string): Promise<string> {
    const children = await this.getItemChildren(itemId);
    const pdfAttachment = children.find(
      (c) => c.data.itemType === "attachment" && c.data.contentType === "application/pdf"
    );

    if (!pdfAttachment) {
      throw new Error("No PDF attachment found for this item");
    }

    try {
      const response = await this.client.get(`/users/${this.userId}/items/${pdfAttachment.key}/file`, {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(response.data);
      const data = await pdf(buffer);
      return data.text;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        this.handleApiError(error, `downloading PDF attachment for item '${itemId}'`);
      }
      throw new Error(`Failed to extract PDF text for item '${itemId}': ${error.message}`);
    }
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

    try {
      const response = await this.client.post(`/users/${this.userId}/items`, note);
      return response.data;
    } catch (error) {
      this.handleApiError(error, `adding a note to item '${parentItemId}'`);
    }
  }

  /**
   * Retrieve the citation key (Better BibTeX) or create a standard one.
   * @param itemId The unique Zotero item key.
   */
  async getCiteKey(itemId: string): Promise<string> {
    const item = await this.getItem(itemId);
    const extraFields = item.data.extra || "";
    const match = extraFields.match(/citationKey:\s*([^\s]+)/);
    
    if (match) return match[1];
    
    // Fallback: simple slug generator
    const creator = item.data.creators?.[0]?.lastName || "Unknown";
    const year = (item.data.date || "0000").substring(0, 4);
    return `${creator}${year}`;
  }
}
