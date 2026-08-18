import axios from 'axios';

async function forensic() {
  const headers = { 'Zotero-API-Key': process.env.ZOTERO_API_KEY || '' };
  const uid = process.env.ZOTERO_USER_ID || '';
  try {
    console.error("Checking for Group Libraries...");
    const groupsResponse = await axios.get(`https://api.zotero.org/users/${uid}/groups`, { headers });
    const groups = groupsResponse.data;
    
    console.error(`Found ${groups.length} Group Libraries.`);
    for (const g of groups) {
       console.error(`Scanning Group ${g.id}: ${g.data.name}...`);
       // Check Active Items Count
       const gItems = await axios.get(`https://api.zotero.org/groups/${g.id}/items?limit=1`, { headers });
       console.error(`   Group ${g.id} Active Items Total: ${gItems.headers['total-results']}`);
       // Check Trashed Items Count
       const gTrash = await axios.get(`https://api.zotero.org/groups/${g.id}/items?trashed=1&limit=1`, { headers });
       console.error(`   Group ${g.id} Trashed Items Total: ${gTrash.headers['total-results']}`);
    }
  } catch (err: any) {
    console.error(`Forensic Scan Failed: ${err.message}`);
  }
}

forensic();
