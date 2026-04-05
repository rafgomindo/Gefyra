import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { ZoteroClient } from './zotero-client.js';

// Configuration: Zotero Storage
const ZOTERO_STORAGE_DIR = 'C:\\Users\\sdjrp\\Zotero\\storage';

async function getLocalPdfPath(itemKey: string, fileName: string): Promise<string | null> {
    const itemDir = path.join(ZOTERO_STORAGE_DIR, itemKey);
    if (!fs.existsSync(itemDir)) {
        // console.log(`   Dir not found: ${itemDir}`);
        return null;
    }

    const actualFileName = fileName.startsWith('storage:') ? fileName.substring(8) : fileName;
    let fullPath = path.join(itemDir, actualFileName);
    
    if (fs.existsSync(fullPath)) return fullPath;

    // Fallback search
    try {
        const files = fs.readdirSync(itemDir);
        const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
        return pdfFile ? path.join(itemDir, pdfFile) : null;
    } catch (e) {
        return null;
    }
}

async function extractPdfText(pdfPath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfFunc = (typeof pdf === 'function') ? pdf : pdf.default;
    if (typeof pdfFunc !== 'function') throw new Error('pdf-parse is not a function');
    const data = await pdfFunc(dataBuffer, { max: 1 });
    return data.text.substring(0, 2000);
}

async function main() {
    const manifestFile = './zotero_file_paths.json';
    const logFile = './tier1_execution.log';
    
    if (!fs.existsSync(manifestFile)) {
        console.error("Manifest missing.");
        process.exit(1);
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const fixed = new Set(fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l.trim()) : []);
    
    console.log(`Phase 2: Deep Local Extraction Debug`);
    console.log(`Manifest Size: ${manifest.length}`);
    console.log(`Fixed Set Size: ${fixed.size}`);
    
    const limit = 5; 
    let processed = 0;
    
    for (const item of manifest) {
        if (processed >= limit) break;
        
        if (fixed.has(item.key)) continue;

        const pdfPath = await getLocalPdfPath(item.key, item.path);
        if (!pdfPath) {
            // console.log(`   No PDF for ${item.key}`);
            continue;
        }

        console.log(`[${processed+1}] Item: ${item.key} | Path: ${pdfPath}`);
        try {
            const text = await extractPdfText(pdfPath);
            console.log(`   Snippet: ${text.replace(/\s+/g, ' ').trim().substring(0, 300)}...`);
            processed++;
        } catch (e: any) {
            console.log(`   Error reading PDF: ${e.message}`);
        }
    }
}

main().catch(console.error);
