import * as fs from 'fs';
import { parseFilenameMetadata } from './utils.js';

function main() {
    const auditFile = './broken_items_audit.json';
    if (!fs.existsSync(auditFile)) {
        console.error("Audit file missing.");
        process.exit(1);
    }
    
    const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
    const brokenItems = auditData.brokenItems;
    
    const tier1 = brokenItems.filter((it: any) => parseFilenameMetadata(it.title) !== null);
    
    console.log(`Summary:`);
    console.log(`- Total Broken: ${brokenItems.length}`);
    console.log(`- Tier 1 Candidates: ${tier1.length}`);
    console.log(`\nSample Tier 1:`);
    tier1.slice(0, 10).forEach((it:any) => {
        const p = parseFilenameMetadata(it.title);
        console.log(`  [${it.key}] Author: ${p.creators.map((c:any)=>c.lastName).join(', ')} | Year: ${p.date} | Title: ${p.title}`);
    });
}

main();
