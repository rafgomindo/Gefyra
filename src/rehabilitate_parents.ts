import { ZoteroClient } from "./zotero-client.js";
import * as fs from "fs";

// SUSPECTS Mapping (ParentKey -> ChildKey)
const mappings = [
    { parent: "CDE95H27", child: "T8RBXI6Z" }, // ifg1de1.pdf
    { parent: "6WT2T5N3", child: "WKT2E3BZ" }, // JOAC2011B.pdf
    { parent: "VWBN5MDP", child: "69G8R8GZ" },
    { parent: "J5KDKW26", child: "L2T2YQAJ" },
    { parent: "TJXCXQ2G", child: "QK7I8H9J" },
    { parent: "NM342QBA", child: "M8I7O6N5" },
    { parent: "CDUBHB8Z", child: "B5V4C3X2" }
];

async function main() {
    const client = new ZoteroClient();
    
    // Load snippets
    const snippets: Record<string, string> = {};
    const lines = fs.readFileSync("pdf_snippets.jsonl", "utf-8").split("\n");
    for (const L of lines) {
        if (!L.trim()) continue;
        const obj = JSON.parse(L);
        snippets[obj.key] = obj.text || obj.first_page_text || "";
    }

    console.log(`Rehabilitating ${mappings.length} suspect parents...`);

    for (const m of mappings) {
        console.log(`Processing Parent ${m.parent} (Child ${m.child})...`);
        const snippet = snippets[m.child] || "";
        
        // Simple metadata extraction (reusing logic)
        const proposedTitle = extractTitle(snippet) || "Unknown Title";
        const proposedYear = extractYear(snippet);
        
        try {
            // 1. Create New Parent (Journal Article as default)
            const parentData = {
                itemType: "journalArticle",
                title: proposedTitle,
                date: proposedYear || "",
                creators: [], // For now, keep it simple or expand if snippet has authors
                tags: [{ tag: "gefyra:rehabilitated" }, { tag: "gefyra:phase2" }]
            };
            
            const newParent = await client.createItem(parentData);
            // Zotero createItem returns a specific structure
            const newParentKey = newParent.successful["0"].key;
            console.log(`   [SUCCESS] Created new parent ${newParentKey} with title: ${proposedTitle}`);

            // 2. Move Attachment
            await client.reparentAttachment(m.child, newParentKey);
            console.log(`   [SUCCESS] Moved child ${m.child} to new parent.`);

            // 3. Optional: Delete old parent
            // await client.deleteItem(m.parent);
            // console.log(`   [SUCCESS] Deleted old suspect parent.`);
            
        } catch (e) {
            console.error(`   [ERROR] Failed to rehabilitate ${m.parent}:`, e);
        }
    }
}

function extractTitle(snippet: string): string | null {
    const lines = snippet.split("\n").map(l => l.trim()).filter(l => l.length > 15);
    for (const line of lines.slice(0, 5)) {
        if (!/^\d+$|chapter|section|part|issn|isbn|http/i.test(line)) return line;
    }
    return null;
}

function extractYear(snippet: string): string | null {
    const match = snippet.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : null;
}

main();
