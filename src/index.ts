#!/usr/bin/env node
import process from "node:process";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ZoteroClient, ZoteroItem } from "./zotero-client.js";

let zoteroClient: ZoteroClient;

try {
  const userId = (process.env.ZOTERO_USER_ID || "7679932").trim();
  const apiKey = (process.env.ZOTERO_API_KEY || "").trim();
  console.error(`Gefyra v2.1.4-FINAL-REV5 Initialization: UserID="${userId}", KeyLength=${apiKey.length}`);
  zoteroClient = new ZoteroClient();
} catch (error: any) {
  console.error("Warning: Zotero client could not be initialized.");
  console.error(error.message);
}

const server = new Server(
  {
    name: "gefyra",
    version: "3.1.0",
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
        name: "zotero_raw_request",
        description: "Diagnostic tool to make a raw request to the Zotero Cloud",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The relative URL to call (e.g. /users/123/items)",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "gefyra_restart",
        description: "Force the server to exit so the host can restart it with the latest binary.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
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
      {
        name: "zotero_create_item",
        description: "Create a new research item in Zotero",
        inputSchema: {
          type: "object",
          properties: {
            itemType: {
              type: "string",
              description: "The type of item (e.g., 'journalArticle', 'book', 'webpage')",
            },
            title: {
              type: "string",
              description: "The title of the item",
            },
            creators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  creatorType: { type: "string", description: "e.g., 'author'" },
                },
              },
            },
            tags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tag: { type: "string" },
                },
              },
            },
          },
          required: ["itemType", "title"],
        },
      },
      {
        name: "zotero_update_item",
        description: "Update an existing item's metadata",
        inputSchema: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The unique Zotero item ID",
            },
            updates: {
              type: "object",
              description: "The fields to update (e.g., { title: 'New Title' })",
            },
            version: {
              type: "number",
              description: "Current version of the item (optional but recommended)",
            },
          },
          required: ["itemId", "updates"],
        },
      },
      {
        name: "zotero_trash_item",
        description: "Move a Zotero item to the trash",
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
        name: "zotero_create_collection",
        description: "Create a new collection folder in Zotero",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the collection",
            },
            parentKey: {
              type: "string",
              description: "Optional parent collection ID",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "zotero_add_tags",
        description: "Add tags to an existing Zotero item",
        inputSchema: {
          type: "object",
          properties: {
            itemId: {
              type: "string",
              description: "The unique Zotero item ID",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Array of tag names to add",
            },
          },
          required: ["itemId", "tags"],
        },
      },
      {
        name: "zotero_list_tags",
        description: "List all tags in your Zotero library",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "zotero_get_collection_tree",
        description: "Get a hierarchical tree of all collections",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "zotero_get_library_stats",
        description: "Get high-level statistics of your Zotero library",
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
    if (name === "gefyra_restart") {
      setTimeout(() => process.exit(0), 100);
      return {
        content: [{ type: "text", text: "Gefyra is restarting..." }],
      };
    }

    if (name === "zotero_raw_request") {
      const { url } = z.object({ url: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      const result = await (zoteroClient as any).request("get", url, { params: { format: "json" } });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

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

    if (name === "zotero_create_item") {
      const itemData = z.object({ 
        itemType: z.string(),
        title: z.string(),
        creators: z.array(z.any()).optional(),
        tags: z.array(z.any()).optional(),
      }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      const result = await zoteroClient.createItem(itemData);
      return {
        content: [{ type: "text", text: `Item created successfully: ${JSON.stringify(result, null, 2)}` }],
      };
    }

    if (name === "zotero_update_item") {
      const { itemId, updates, version } = z.object({ 
        itemId: z.string(),
        updates: z.record(z.string(), z.any()),
        version: z.number().optional(),
      }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      const result = await zoteroClient.updateItem(itemId, updates, version);
      return {
        content: [{ type: "text", text: `Item ${itemId} updated successfully.` }],
      };
    }

    if (name === "zotero_trash_item") {
      const { itemId } = z.object({ itemId: z.string() }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      await zoteroClient.trashItem(itemId);
      return {
        content: [{ type: "text", text: `Item ${itemId} moved to trash.` }],
      };
    }

    if (name === "zotero_create_collection") {
      const { name, parentKey } = z.object({ 
        name: z.string(),
        parentKey: z.string().optional(),
      }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      const result = await zoteroClient.createCollection(name, parentKey);
      return {
        content: [{ type: "text", text: `Collection '${name}' created successfully.` }],
      };
    }

    if (name === "zotero_add_tags") {
      const { itemId, tags } = z.object({ 
        itemId: z.string(),
        tags: z.array(z.string()),
      }).parse(args);
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      
      await zoteroClient.addTags(itemId, tags);
      return {
        content: [{ type: "text", text: `Tags added successfully to item ${itemId}.` }],
      };
    }

    if (name === "zotero_list_tags") {
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      const tags = await zoteroClient.listTags();
      return {
        content: [{ type: "text", text: JSON.stringify(tags, null, 2) }],
      };
    }

    if (name === "zotero_get_collection_tree") {
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      const tree = await zoteroClient.getCollectionTree();
      return {
        content: [{ type: "text", text: JSON.stringify(tree, null, 2) }],
      };
    }

    if (name === "zotero_get_library_stats") {
      if (!zoteroClient) throw new Error("Zotero client not initialized");
      const stats = await zoteroClient.getLibraryStats();
      return {
        content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
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
 * Helper to strip research-specific noise from titles for better deduplication.
 */
function canonicalizeTitle(title: string): string {
  let c = title.toLowerCase().trim();
  
  // Suffixes: .pdf, on JSTOR, etc.
  c = c.replace(/\.(pdf|htm|html|docx)$/i, "");
  c = c.replace(/ on jstor(\.htm)?$/i, "");
  c = c.replace(/ - jstor$/i, "");
  
  // Clean trailing "a" (Better BibTeX suffix)
  if (c.endsWith("a") && c.length > 5) {
    c = c.slice(0, -1);
  }
  
  // Remove trailing punctuation and normalize whitespace
  return c.replace(/[.,;!?-]$/, "").replace(/\s+/g, " ").trim();
}

/**
 * Helper to capitalize the first letter of each word in a string.
 */
function capitalizeTitle(title: string): string {
  return title
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Helper to extract author/year/title from filenames like:
 * GARCÍA_BRENES_MD_2000_Cambio_agrario_y_desarrollo_.pdf
 * gonzalez-turmo-2012-chapitre-5...
 * Goffman.Frame.Analysis.pdf
 */
function parseFilenameMetadata(filename: string): any | null {
  const cleanFilename = filename.replace(/\.(pdf|htm|html|docx)$/i, "");
  
  let authorPart = "";
  let titlePart = "";
  let year = "";

  // 1. HIGH PRIORITY: Explicit separator " - " or " | "
  if (filename.includes(" - ") || filename.includes(" | ")) {
    const separator = filename.includes(" - ") ? " - " : " | ";
    const sParts = cleanFilename.split(separator);
    if (sParts.length >= 2) {
      authorPart = sParts[0].trim();
      titlePart = sParts.slice(1).join(separator).trim();
      
      // Look for a year inside the titlePart just in case
      const tWords = titlePart.split(/[_\s.-]+/);
      const yIdx = tWords.findIndex(p => /^(19|20)\d{2}$/.test(p));
      if (yIdx !== -1) {
        year = tWords[yIdx];
        // If year is high confidence, we could re-split, but usually Author - Title is enough.
      }
    }
  }

  // 2. YEAR-BASED PATTERN (if author not found or to refine)
  if (!authorPart) {
    const parts = cleanFilename.split(/[_\s.-]+/).filter(p => p.length > 0);
    const yearIdx = parts.findIndex(p => /^(19|20)\d{2}$/.test(p));
    
    if (yearIdx !== -1) {
      year = parts[yearIdx];
      authorPart = parts.slice(0, yearIdx).join(" ").trim();
      titlePart = parts.slice(yearIdx + 1).join(" ").trim();
    } else if (parts.length >= 3) {
      // 3. FALLBACK: Author.Title.Title (at least 3 parts)
      authorPart = parts[0];
      titlePart = parts.slice(1).join(" ").trim();
    }
  }
  
  if (!authorPart || !titlePart) return null;

  return {
    title: capitalizeTitle(titlePart),
    date: year || undefined,
    creators: [
      {
        creatorType: "author",
        lastName: authorPart,
        firstName: ""
      }
    ]
  };
}

/**
 * Start the server using stdio transport.
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--audit")) {
    console.error("Starting Definitive Library Audit...");
    const client = new ZoteroClient();
    try {
      const items = await client.fetchAllLibraryItems();
      const trash = await client.fetchTrashItems();
      
      console.error(`\nSCAN COMPLETE:\n - Active Items: ${items.length}\n - Trashed Items: ${trash.length}`);
      process.exit(0);
    } catch (err: any) {
      console.error(`Audit failed: ${err.message}`);
      process.exit(1);
    }
  }
  
  if (args.includes("--search")) {
    const queryIdx = args.indexOf("--search") + 1;
    const query = args[queryIdx];
    console.error(`Searching for: ${query}`);
    const client = new ZoteroClient();
    try {
      const items = await client.searchItems(query);
      console.log(JSON.stringify(items, null, 2));
      process.exit(0);
    } catch (err: any) {
      console.error(`Search failed: ${err.message}`);
      process.exit(1);
    }
  }

  if (args.includes("--restore-all")) {
    console.error("Starting Hardened Emergency Library Restoration Mode...");
    const client = new ZoteroClient();
    try {
      console.error("Locating every remaining item in the Zotero Trash...");
      const trashItems = await client.fetchTrashItems();
      
      console.error(`Status: Found ${trashItems.length} items still in the trash.`);
      
      for (let i = 0; i < trashItems.length; i++) {
        let item = trashItems[i];
        let restored = false;
        let attempts = 0;

        while (!restored && attempts < 2) {
          try {
            attempts++;
            await client.updateItem(item.key, { deleted: 0 }, item.version);
            console.error(`[${i+1}/${trashItems.length}] Restored: ${item.key} (${item.data.title || "No Title"})`);
            restored = true;
          } catch (err: any) {
            if (err.message.includes("428") && attempts === 1) {
              console.error(`   Version mismatch for ${item.key}. Refreshing and retrying...`);
              try {
                 // Refresh item metadata to get new version
                 const refreshed = await client.getItem(item.key);
                 item = refreshed;
              } catch (refreshErr) {
                 break;
              }
            } else {
              console.error(`   Restoring ${item.key} failed: ${err.message}`);
              break;
            }
          }
        }
      }
      
      console.error("RESTORATION COMPLETE! Your library should be fully recovered.");
      process.exit(0);
    } catch (err: any) {
      console.error(`Restoration failed: ${err.message}`);
      process.exit(1);
    }
  }

  if (args.includes("--dedupe") || args.includes("--tag-duplicates") || args.includes("--dedupe-apply")) {
    const applyMode = args.includes("--dedupe-apply");
    console.error(applyMode ? "Starting DESTRUCTIVE Deduplication Mode (Trashing Duplicates)..." : "Starting SAFE Deduplication Mode (Tagging Only)...");
    const client = new ZoteroClient();
    
    try {
      console.error("Scanning library for duplicate research candidates...");
      const items = await client.fetchAllLibraryItems();
      
      // 1. Cluster items by potential duplicates
      const clusters = new Map<string, ZoteroItem[]>();
      
      for (const item of items) {
        const itemData = item.data;
        let title = (itemData.title || "").trim();
        if (title.length < 5) continue; // Skip very short titles
        if (title.toLowerCase().endsWith(".pdf") || title.toLowerCase().endsWith(".zip")) continue;
        
        // --- FUZZY GROUPING: Advanced Canonicalization ---
        let canonicalTitle = canonicalizeTitle(title);

        const creators = (itemData.creators || []).map((c: any) => c.lastName || "").join(",");
        const year = (itemData.date || "").substring(0, 4);
        const type = itemData.itemType;

        const clusterKey = `${canonicalTitle}|${creators.toLowerCase()}|${year}|${type}`;
        
        if (!clusters.has(clusterKey)) {
          clusters.set(clusterKey, []);
        }
        clusters.get(clusterKey)!.push(item);
      }
      
      let processedCount = 0;
      let actionCount = 0;
      
      // 2. Process each cluster
      for (const [clusterKey, cluster] of clusters.entries()) {
        if (cluster.length <= 1) continue;
        
        console.error(`Status: Found ${cluster.length} candidates for cluster | ${clusterKey.substring(0, 100)}...`);
        
        // --- SCORING SYSTEM: Identify the "Keeper" ---
        const scoredItems = await Promise.all(cluster.map(async (item) => {
          let score = Object.keys(item.data).length; // Base score on metadata count
          
          if (item.data.abstractNote) score += 3;
          if (item.data.DOI || item.data.ISBN) score += 2;
          
          // Penalize trailing 'a' if a non-a version exists in this cluster
          const hasBaseVersion = cluster.some(i => !(i.data.title || "").toLowerCase().endsWith("a"));
          if (hasBaseVersion && (item.data.title || "").toLowerCase().endsWith("a")) {
            score -= 10;
          }

          // Check for attachments (heavy weight)
          try {
            const children = await client.getItemChildren(item.key);
            const pdfs = children.filter(c => c.data.itemType === "attachment" && c.data.contentType === "application/pdf");
            score += (pdfs.length * 5);
          } catch (e) {
            // Child fetch failed, ignore
          }
          
          return { item, score };
        }));
        
        // Sort by score descending
        scoredItems.sort((a, b) => b.score - a.score);
        
        const keeper = scoredItems[0].item;
        const duplicates = scoredItems.slice(1);
        
        console.error(`   -> Selected Keeper: [${keeper.key}] (Score: ${scoredItems[0].score}) | ${keeper.data.title || "No Title"}`);
        
        for (const { item, score } of duplicates) {
          if (applyMode) {
            console.error(`   [TRASHING] duplicate [${item.key}] (Score: ${score}) | ${item.data.title || "No Title"}`);
            await client.trashItem(item.key, item.version);
          } else {
            console.error(`   [TAGGING] duplicate [${item.key}] (Score: ${score}) | ${item.data.title || "No Title"}`);
            await client.addTags(item.key, ["gefyra:duplicate"]);
          }
          actionCount++;
        }
        processedCount++;
      }
      
      console.error(`\nSUCCESS: ${applyMode ? "Trashed" : "Tagged"} ${actionCount} duplicates across ${processedCount} clusters.`);
      if (!applyMode) {
        console.error("Manual review required: Search for 'gefyra:duplicate' in Zotero to verify. Use --dedupe-apply to automate trashing.");
      }
      process.exit(0);
    } catch (err: any) {
      console.error(`Dedupe failed: ${err.message}`);
      process.exit(1);
    }
  }

  if (args.includes("--fix-metadata")) {
    console.error("Starting Standalone Metadata Enrichment Mode...");
    const client = new ZoteroClient();
    
    try {
      console.error("Scanning library for unfinished items...");
      const items = await client.fetchAllLibraryItems();
      const unfinished = items.filter(item => {
        const data = item.data;
        const title = (data.title || "").toLowerCase();
        // Identify unfinished: title ends in extension, or no creators
        if (data.itemType === "note") return false;

        // If it's an attachment, we only want to fix it if it has no parent or its title is a filename
        if (data.itemType === "attachment" && !title.endsWith(".pdf") && !title.endsWith(".docx")) return false;

        return title.endsWith(".pdf") || 
               title.endsWith(".docx") || 
               !data.creators || data.creators.length === 0 ||
               title.length < 5;
      });
      
      console.error(`Found ${unfinished.length} unfinished items to fix.`);
      
      for (let i = 0; i < unfinished.length; i++) {
        const item = unfinished[i];
        const data = item.data;
        const currentTitle = data.title || "";
        console.error(`[${i+1}/${unfinished.length}] Enriching: ${item.key} (${currentTitle})`);
        
        try {
          const updates: any = {};
          
          if (!currentTitle) {
             console.error("   SKIP: Title is missing.");
             continue;
          }

          // 1. ADVANCED: Try to parse AUTHOR_YEAR_TITLE from filename
          const filenameParse = parseFilenameMetadata(currentTitle);
          if (filenameParse) {
            Object.assign(updates, filenameParse);
            
            // SPECIAL HANDLING: Attachments don't support creators/date
            if (data.itemType === "attachment") {
              const yearSuffix = filenameParse.date ? ` ${filenameParse.date}` : "";
              const authorPrefix = filenameParse.creators && filenameParse.creators[0] ? `${filenameParse.creators[0].lastName}: ` : "";
              updates.title = `${authorPrefix}${filenameParse.title}${yearSuffix}`;
              delete updates.creators;
              delete updates.date;
              console.error(`   ATTACHMENT CLEANUP: ${updates.title}`);
            } else {
              console.error(`   PARSE SUCCESS: ${updates.creators[0].lastName} (${updates.date}) - ${updates.title}`);
            }
          } else {
            // 2. Fallback: Clean filename title if parsing failed
            let newTitle = currentTitle;
            if (newTitle.toLowerCase().endsWith(".pdf")) {
              newTitle = newTitle.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
              updates.title = newTitle;
              console.error(`   CLEANED FILENAME: ${newTitle}`);
            }
          }
          
          if (Object.keys(updates).length > 0) {
             await client.updateItem(item.key, updates, item.version);
          } else {
             console.error("   SKIP: No enrichment pattern identified.");
          }
        } catch (err: any) {
          console.error(`   Failed to fix ${item.key}: ${err.message}`);
        }
      }
      
      console.error("METADATA ENRICHMENT COMPLETE!");
      process.exit(0);
    } catch (err: any) {
      console.error(`Enrichment failed: ${err.message}`);
      process.exit(1);
    }
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // SECURE DIAGNOSTIC: Log limited info to stderr to verify ENV injection
  const uid = process.env.ZOTERO_USER_ID || "not-set";
  const keyExists = !!process.env.ZOTERO_API_KEY;
  const keyStart = process.env.ZOTERO_API_KEY ? process.env.ZOTERO_API_KEY.substring(0, 4) : "none";
  
  console.error(`Gefyra v2.1.12 running. UID: ${uid}, KEY_START: ${keyStart}... (Exists: ${keyExists})`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
