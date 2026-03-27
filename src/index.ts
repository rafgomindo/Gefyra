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
    version: "1.0.0",
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
      const { query } = z.object({ query: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      const items = await zoteroClient.searchItems(query);
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
