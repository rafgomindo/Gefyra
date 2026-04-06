import axios from 'axios';

async function forensic() {
  const headers = { 'Zotero-API-Key': 'mGvqRaKVSavhQqD2RQh1vL9A' };
  try {
    console.error("Checking for Group Libraries...");
    const groupsResponse = await axios.get('https://api.zotero.org/users/7679932/groups', { headers });
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
