import * as fs from 'fs';
import * as path from 'path';
import { ZoteroClient } from './zotero-client.js';
import { parseFilenameMetadata } from './utils.js';

// Configuration: Zotero Storage
const ZOTERO_STORAGE_DIR = 'C:\\Users\\sdjrp\\Zotero\\storage';

async function getLocalPdfPath(itemKey: string, fileName: string): Promise<string | null> {
    const itemDir = path.join(ZOTERO_STORAGE_DIR, itemKey);
    if (!fs.existsSync(itemDir)) return null;

    // The fileName in Zotero might be "storage:file.pdf"
    const actualFileName = fileName.startsWith('storage:') ? fileName.substring(8) : fileName;
    const fullPath = path.join(itemDir, actualFileName);
    
    if (fs.existsSync(fullPath)) return fullPath;

    // Fallback: search for any PDF in the directory if the name doesn't match exactly
    const files = fs.readdirSync(itemDir);
    const pdf = files.find(f => f.toLowerCase().endsWith('.pdf'));
    return pdf ? path.join(itemDir, pdf) : null;
}

async function main() {
    const client = new ZoteroClient();
    const manifestFile = './zotero_file_paths.json';
    const logFile = './tier1_execution.log';
    const progressFile = './phase2_progress.log';
    
    if (!fs.existsSync(manifestFile)) {
        console.error("Manifest file missing. Run extract_zotero_paths.py first.");
        process.exit(1);
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const fixed = new Set(fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n') : []);
    const phase2_fixed = new Set(fs.existsSync(progressFile) ? fs.readFileSync(progressFile, 'utf8').split('\n') : []);
    
    const candidates = manifest.filter((it: any) => !fixed.has(it.key) && !phase2_fixed.has(it.key));
    
    const limit = 20; // Small batch size for safety and logs
    let processed = 0;
    
    console.error(`Phase 2: Deep Local Extraction (Candidates: ${candidates.length})...`);
    
    for (const item of candidates) {
        if (processed >= limit) break;
        
        console.error(`[${processed+1}/${limit}] Item: ${item.key}`);
        const pdfPath = await getLocalPdfPath(item.key, item.path);
        
        if (pdfPath) {
            console.error(`   Found Locally: ${pdfPath}`);
            // TODO: Extract text via pdf-parse and send to AI for metadata
            // For now, we are simulating the 'Located' state to verify the pathing logic.
            fs.appendFileSync(progressFile, `${item.key}\n`);
            processed++;
        } else {
            console.error(`   Fail: PDF not found in storage folder.`);
        }
    }
    
    console.error(`Batch complete. Verified ${processed} local PDFs.`);
    process.exit(0);
}

main().catch(console.error);
