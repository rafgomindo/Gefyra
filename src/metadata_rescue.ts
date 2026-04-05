import { ZoteroClient } from "./zotero-client.js";
import axios from "axios";
import * as fs from "fs";

async function fetchFromCrossRef(doi: string) {
    try {
        const url = `https://api.crossref.org/works/${doi}`;
        const resp = await axios.get(url);
        const work = resp.data.message;
        
        return {
            title: work.title ? work.title[0] : null,
            creators: work.author ? work.author.map((a: any) => ({
                creatorType: "author",
                firstName: a.given,
                lastName: a.family
            })) : [],
            date: work.issued ? work.issued['date-parts'][0][0] : null,
            publicationTitle: work['container-title'] ? work['container-title'][0] : null
        };
    } catch (e) {
        return null;
    }
}

async function main() {
    const client = new ZoteroClient();
    console.log("Starting Metadata Rescue (DOI Auto-Fetch)...");

    const allItems = await client.fetchAllLibraryItems();
    
    // Identify targets: Generic titles or fragments
    const targets = allItems.filter(i => {
        const t = i.data.title || "";
        return t === "Untitled" || 
               t === "PDF" || 
               t === "Recovered Item" ||
               /^\d+[\s\-_]\d+$/.test(t) ||
               t.length < 5;
    });

    console.log(`Found ${targets.length} items with generic metadata.`);

    for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        console.log(`[${i+1}/${targets.length}] Attempting rescue for ${item.key}: '${item.data.title}'`);
        
        try {
            const children = await client.getChildren(item.key);
            const pdf = children.find(c => c.data.contentType === 'application/pdf');
            
            if (pdf) {
                // Read text to find DOI
                const content = await client.getAttachmentText(pdf.key);
                const doiMatch = content.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
                
                if (doiMatch) {
                    const doi = doiMatch[0];
                    console.log(`    Found DOI: ${doi}`);
                    const metadata = await fetchFromCrossRef(doi);
                    
                    if (metadata && metadata.title) {
                        console.log(`    Found metadata! Title: '${metadata.title}'`);
                        await client.updateItem(item.key, {
                            title: metadata.title,
                            creators: metadata.creators,
                            date: metadata.date?.toString(),
                            publicationTitle: metadata.publicationTitle,
                            tags: (item.data.tags || []).concat([{ tag: "gefyra:metadata-fetched" }, { tag: "gefyra:fixed" }])
                        }, item.version);
                        continue;
                    }
                }
            }
        } catch (e: any) {
            console.error(`    [ERROR] Rescue failed:`, e.message);
        }

        // Tag as audited to avoid repeat processing
        await client.updateItem(item.key, {
            tags: (item.data.tags || []).concat([{ tag: "gefyra:audited" }])
        }, item.version);

        await new Promise(r => setTimeout(r, 600));
    }
    
    console.log("Metadata Rescue Complete!");
}

main();
