import { ZoteroClient } from './zotero-client.js';
import { OCREngine } from './ocr-engine.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const client = new ZoteroClient();
    const ocr = new OCREngine();
    
    const auditFile = './broken_items_audit.json';
    if (!fs.existsSync(auditFile)) {
        console.error("Audit file missing. Run audit first.");
        process.exit(1);
    }
    
    const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
    const brokenItems = auditData.brokenItems;
    
    // Load completed keys
    const logFile = './tier1_execution.log';
    const completedKeys = new Set(fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n') : []);
    
    // Filter out completed
    const pendingItems = brokenItems.filter((it: any) => !completedKeys.has(it.key));
    
    // Configurable Slice
    const startIdx = parseInt(process.argv[2] || "0");
    const limit = parseInt(process.argv[3] || "20");
    const batch = pendingItems.slice(startIdx, startIdx + limit);
    
    console.error(`Processing Batch: ${startIdx} to ${startIdx + limit} (${batch.length} items)...`);
    
    const extractionResults: any[] = [];
    
    for (const item of batch) {
        console.error(`--> Analyzing: ${item.key} | ${item.title}`);
        try {
            // Find attachment
            const children = await client.getItemChildren(item.key);
            const pdf = children.find((c: any) => c.data.itemType === "attachment" && c.data.contentType === "application/pdf");
            
            if (!pdf) {
                // If it's a top-level attachment, it has no children, it IS the PDF
                if (item.itemType === "attachment") {
                    const text = await extractContent(client, ocr, item.key, item.title);
                    extractionResults.push({ key: item.key, title: item.title, text });
                } else {
                    console.error("   Skip: No PDF attachment found.");
                }
                continue;
            }
            
            const text = await extractContent(client, ocr, pdf.key, item.title);
            extractionResults.push({ key: item.key, parentKey: item.key, attachmentKey: pdf.key, title: item.title, text });
            
        } catch (err: any) {
            console.error(`   Failed: ${err.message}`);
        }
    }
    
    const outPath = `batch_extract_${startIdx}.json`;
    fs.writeFileSync(outPath, JSON.stringify(extractionResults, null, 2));
    console.error(`Extraction complete. Saved to ${outPath}`);
    process.exit(0);
}

async function extractContent(client: ZoteroClient, ocr: OCREngine, key: string, titleName: string): Promise<string> {
    const buffer = await client.client_for_file_download(key);
    const tempPdf = path.join(process.cwd(), `temp_${key}.pdf`);
    fs.writeFileSync(tempPdf, Buffer.from(buffer));
    
    const outTxt = path.join(process.cwd(), `temp_${key}.txt`);
    const text = await ocr.performOCR(tempPdf, outTxt);
    
    // Cleanup
    if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
    if (fs.existsSync(outTxt)) fs.unlinkSync(outTxt);
    
    return text.substring(0, 3000); // Only keep enough for metadata
}

main().catch(console.error);
