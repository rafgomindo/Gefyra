import { ZoteroClient } from './zotero-client.js';
import { OCREngine } from './ocr-engine.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const client = new ZoteroClient();
    const ocr = new OCREngine();
    
    // Test identifying Frontex item specifically
    console.error("Looking for Frontex target item...");
    const items = await client.searchItems("Frontex");
    const target = items.find((it: any) => (it.data.title || "").includes("Frontex") && (it.data.title || "").endsWith(".pdf"));
    
    if (!target) {
        console.error("Target item not found in top 50 search results. Please check key.");
        process.exit(1);
    }
    
    console.error(`Status: Found target item ${target.key} | ${target.data.title}`);
    
    // 1. Get children to find PDF
    const children = await client.getItemChildren(target.key);
    const pdfAttachment = children.find((c: any) => c.data.itemType === "attachment" && c.data.contentType === "application/pdf");
    
    if (!pdfAttachment) {
        console.error("No PDF attachment found.");
        process.exit(1);
    }
    
    // 2. Download PDF
    console.error(`Status: Downloading attachment ${pdfAttachment.key}...`);
    const buffer = await client.client_for_file_download(pdfAttachment.key);
    const tempPdf = path.join(process.cwd(), 'temp_target.pdf');
    fs.writeFileSync(tempPdf, Buffer.from(buffer));
    
    // 3. OCR Analysis
    console.error("Status: Extracting text...");
    const outTxt = path.join(process.cwd(), 'temp_target_ocr.txt');
    const text = await ocr.performOCR(tempPdf, outTxt);
    
    console.log("=== START PDF TEXT CONTENT ===");
    console.log(text.substring(0, 5000));
    console.log("=== END PDF TEXT CONTENT ===");
    
    process.exit(0);
}

main().catch(console.error);
