# Gefyra (Γέφυρα) 🌉

**Gefyra (Γέφυρα):** A Model Context Protocol (MCP) server that bridges your Zotero research library with AI assistants that use integrated development environments (IDE), enabling seamless searching, metadata retrieval, and citation management.

The name "Gefyra" (Greek: Γέφυρα) represents the bridge between your academic research and your intelligent workspace.

## Features

- **Search Zotero Library**: Find papers, books, and articles by title, author, or keywords.
- **Metadata Retrieval**: Get full bibliographical data for any item in your library.
- **Collection Browsing**: Navigate your Zotero folder structure directly from your AI assistant.
- **MCP Native**: Fully compatible with any MCP client (like Antigravity, Claude Desktop, etc.).

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Zotero API Credentials](https://www.zotero.org/settings/keys)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/rafgomindo/Gefyra.git
   cd Gefyra
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

To use the server, you need to provide your Zotero credentials via environment variables:

- `ZOTERO_USER_ID`: Found in your [Zotero Settings page](https://www.zotero.org/settings/keys).
- `ZOTERO_API_KEY`: Generate a "New Key" on your [Zotero Profile page](https://www.zotero.org/settings/keys).

### Usage with Antigravity / MCP Clients

Add the following to your MCP configuration file (e.g., `mcp_config.json`):

```json
{
  "mcpServers": {
    "gefyra": {
      "command": "node",
      "args": ["C:/Users/sdjrp/Documents/inventos/Gefyra/build/index.js"],
      "env": {
        "ZOTERO_USER_ID": "YOUR_USER_ID",
        "ZOTERO_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Available Tools

### `zotero_search`
- **Description**: Search for items in your Zotero library.
- **Arguments**:
  - `query` (string, required): The search text (title, author, or keyword).

### `zotero_get_item`
- **Description**: Get full metadata and attachments for a specific Zotero item.
- **Arguments**:
  - `itemId` (string, required): The unique Zotero item key.

### `zotero_list_collections`
- **Description**: List all collections (folders) in your library.
- **Arguments**: None.

## License
ISC
