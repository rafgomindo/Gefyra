import * as fs from 'fs';

async function main() {
    const auditFile = './broken_items_audit.json';
    const logFile = './tier1_execution.log';
    
    const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
    const fixed = new Set(fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n') : []);
    
    // Find items that are NOT in Tier 1 and NOT fixed
    const broken = audit.brokenItems.filter((it: any) => !fixed.has(it.key));
    
    console.log(`Total Broken (Unfixed): ${broken.length}`);
    console.log(`\nSample of Unfixed Items (Tier 2/3):`);
    broken.slice(0, 10).forEach((it: any) => {
        console.log(`  [${it.key}] Title: ${it.title}`);
    });
}

main();
