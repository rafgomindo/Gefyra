# How to Add the Zotero MCP to Antigravity IDE

To allow me to use the "Real Zotero" integration, you will need to add a specialized MCP server to your IDE configuration. Here is the technical path:

## 1. Accessing the Configuration
1.  Open **Antigravity IDE**.
2.  Click the **"..." (three dots)** in the top right corner.
3.  Select **"MCP Servers"** (or Agent session > MCP Servers).
4.  Click **"Manage MCP Servers"**.
5.  Click **"View raw config"**. This opens `mcp_config.json`.

## 2. Adding the Zotero Server
You would append a new entry to the `mcpServers` object. It would look something like this (depending on the specific server you choose):

```json
"zotero": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-zotero"],
  "env": {
    "ZOTERO_API_KEY": "YOUR_KEY_HERE",
    "ZOTERO_USER_ID": "YOUR_ID_HERE"
  }
}
```

## 3. How I will use it
Once added, I will have new "Tools" available in my sidebar:
- `zotero_search`: I can ask Zotero for a specific book.
- `zotero_get_full_text`: I can read the PDF directly to write better analysis.
- `zotero_cite`: I can get the perfect APA/Chicago citation.

## 4. Local vs. Online
- **Local version**: Connects via `localhost:8080`. No API key needed, but Zotero Desktop must be open.
- **Online version**: Connects to the Zotero cloud. Needs an API key, but works even if your computer is off.

**Recommendation**: We should start with the **Local version** in our next specialized session for maximum speed and privacy.
