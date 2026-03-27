import axios, { AxiosInstance } from "axios";
import process from "node:process";

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

  /**
   * Search for items in the user's library.
   * @param query The search query string.
   */
  async searchItems(query: string): Promise<ZoteroItem[]> {
    const response = await this.client.get(`/users/${this.userId}/items`, {
      params: {
        q: query,
        format: "json",
        include: "data,meta",
      },
    });
    return response.data;
  }

  /**
   * Get metadata for a specific item.
   * @param itemId The unique Zotero item key.
   */
  async getItem(itemId: string): Promise<ZoteroItem> {
    const response = await this.client.get(`/users/${this.userId}/items/${itemId}`, {
      params: {
        format: "json",
        include: "data,meta",
      },
    });
    return response.data;
  }

  /**
   * List collections in the user's library.
   */
  async listCollections() {
    const response = await this.client.get(`/users/${this.userId}/collections`, {
      params: {
        format: "json",
      },
    });
    return response.data;
  }

  /**
   * Get BibTeX for a specific item.
   * @param itemId The unique Zotero item key.
   */
  async getBibTeX(itemId: string): Promise<string> {
    const response = await this.client.get(`/users/${this.userId}/items/${itemId}`, {
      params: {
        format: "bibtex",
      },
    });
    return response.data;
  }
}
