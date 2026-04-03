#!/usr/bin/env node
import process from "node:process";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ZoteroClient } from "./zotero-client.js";

let zoteroClient: ZoteroClient;

try {
  zoteroClient = new ZoteroClient();
} catch (error: any) {
  console.error("Warning: Zotero client could not be initialized. Please set ZOTERO_USER_ID and ZOTERO_API_KEY.");
  console.error(error.message);
}

const server = new Server(
  {
    name: "gefyra",
    version: "1.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes tools for Zotero integration.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "zotero_search",
        description: "Search for items in your Zotero library",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query (title, author, or keywords)",
            },
            collectionKey: {
              type: "string",
              description: "Optional collection ID to filter results",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "zotero_get_item",
        description: "Get full metadata and attachments for a specific Zotero item",
        inputSchema: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The unique Zotero item ID",
            },
          },
          required: ["itemId"],
        },
      },
      {
        name: "zotero_list_collections",
        description: "List all collections in your Zotero library",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "zotero_get_bibtex",
        description: "Get the BibTeX citation for a specific Zotero item",
        inputSchema: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The unique Zotero item ID",
            },
          },
          required: ["itemId"],
        },
      },
      {
        name: "zotero_get_fulltext",
        description: "Extract and return the text content from the first PDF attachment of an item",
        inputSchema: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The unique Zotero item ID",
            },
          },
          required: ["itemId"],
        },
      },
      {
        name: "zotero_add_note",
        description: "Add a research note to a Zotero item",
        inputSchema: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The parent Zotero item ID",
            },
            note: {
              type: "string",
              description: "The content of the note (HTML or plain text)",
            },
          },
          required: ["itemId", "note"],
        },
      },
      {
        name: "zotero_get_citekey",
        description: "Get the citation key (Better BibTeX) for a specific item",
        inputSchema: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The unique Zotero item ID",
            },
          },
          required: ["itemId"],
        },
      },
    ],
  };
});

/**
 * Handler for tool calls.
 * This is where the actual logic for each tool will be implemented.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "zotero_search") {
      const { query, collectionKey } = z.object({ 
        query: z.string(),
        collectionKey: z.string().optional(),
      }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      const items = await zoteroClient.searchItems(query, collectionKey);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(items, null, 2),
          },
        ],
      };
    }

    if (name === "zotero_get_item") {
      const { itemId } = z.object({ itemId: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");

      const item = await zoteroClient.getItem(itemId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(item, null, 2),
          },
        ],
      };
    }

    if (name === "zotero_list_collections") {
      if (!zoteroClient) throw new Error("Zotero client not initialized");

      const collections = await zoteroClient.listCollections();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(collections, null, 2),
          },
        ],
      };
    }

    if (name === "zotero_get_bibtex") {
      const { itemId } = z.object({ itemId: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");

      const bibtex = await zoteroClient.getBibTeX(itemId);
      return {
        content: [
          {
            type: "text",
            text: bibtex,
          },
        ],
      };
    }

    if (name === "zotero_get_fulltext") {
      const { itemId } = z.object({ itemId: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");

      const text = await zoteroClient.getAttachmentText(itemId);
      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    }

    if (name === "zotero_add_note") {
      const { itemId, note } = z.object({ itemId: z.string(), note: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");

      const result = await zoteroClient.addNote(itemId, note);
      return {
        content: [
          {
            type: "text",
            text: `Note added successfully to item ${itemId}`,
          },
        ],
      };
    }

    if (name === "zotero_get_citekey") {
      const { itemId } = z.object({ itemId: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");

      const citekey = await zoteroClient.getCiteKey(itemId);
      return {
        content: [
          {
            type: "text",
            text: citekey,
          },
        ],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.issues
          .map((e: any) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gefyra MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
