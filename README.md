# Gefyra (Γέφυρα) 🌉

**Gefyra (Γέφυρα):** A Model Context Protocol (MCP) server that bridges your Zotero research library with AI assistants that use integrated development environments (IDE), enabling seamless searching, metadata retrieval, and citation management.

The name "Gefyra" (Greek: Γέφυρα) represents the bridge between your academic research and your intelligent workspace.

## Features

-   **Search Zotero Library**: Find papers, books, and articles by title, author, or keywords.
-   **Metadata Retrieval**: Get full bibliographical data for any item in your library.
-   **Collection Browsing**: Navigate your Zotero folder structure directly from your AI assistant.
-   **Improved Error Diagnostics**: Enhanced error messages provide clear, actionable feedback for issues related to Zotero API configuration (e.g., incorrect User ID, invalid API Key) or network connectivity.
-   **MCP Native**: Fully compatible with any MCP client (like Gemini CLI, Antigravity, Claude Desktop, etc.).

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

`Gefyra` requires your Zotero credentials to operate. These must be provided via environment variables.

### Step 1: Get Your Zotero Credentials

1.  **User ID:** You can find your user ID in your Zotero settings, under [Feeds/API](https://www.zotero.org/settings/keys).
2.  **API Key:** You can create a new API key in the same section of your [Zotero settings](https://www.zotero.org/settings/keys).

### Step 2: Set Environment Variables

Before running `gefyra`, you must set the `ZOTERO_USER_ID` and `ZOTERO_API_KEY` environment variables.

**Windows (Command Prompt):**
```bash
Before running `gefyra`, you must set the `ZOTERO_USER_ID` and `ZOTERO_API_KEY` environment variables. If you want to use a local Zotero library (e.g., via a bridge or plugin), you can also set `ZOTERO_BASE_URL`.

**Default Cloud (Zotero.org):**
- `ZOTERO_USER_ID`: Your Zotero user ID.
- `ZOTERO_API_KEY`: Your Zotero API key.
- `ZOTERO_BASE_URL`: `https://api.zotero.org` (default).

**Local Bridge (e.g., Better BibTeX or Bridge plugin):**
- `ZOTERO_USER_ID`: Usually any string if using a local bridge, or your ID.
- `ZOTERO_API_KEY`: Optional/Not needed depending on your local bridge security.
- `ZOTERO_BASE_URL`: Your local address (e.g., `http://localhost:8080` or `http://localhost:23119`).

**Windows (Command Prompt):**
```bash
set ZOTERO_USER_ID=your_user_id
set ZOTERO_API_KEY=your_api_key
set ZOTERO_BASE_URL=https://api.zotero.org
```

**Windows (PowerShell):**
```powershell
$env:ZOTERO_USER_ID="your_user_id"
$env:ZOTERO_API_KEY="your_api_key"
$env:ZOTERO_BASE_URL="https://api.zotero.org"
```

### Step 3: Integrate with an AI Assistant (e.g., Gemini CLI)

Update your `mcp_config.json` with the correct path and environment variables:

```json
"gefyra": {
  "command": "node",
  "args": ["c:/Users/sdjrp/Documents/inventos/Gefyra/build/index.js"],
  "env": {
    "ZOTERO_USER_ID": "YOUR_USER_ID",
    "ZOTERO_API_KEY": "YOUR_API_KEY",
    "ZOTERO_BASE_URL": "https://api.zotero.org"
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

## Troubleshooting

If you encounter issues:
1.  **Check 404 Errors:** This usually means your `ZOTERO_USER_ID` or the requested `itemId` is incorrect. If you're trying to use local Zotero, ensure your `ZOTERO_BASE_URL` points to an active bridge (like `http://localhost:8080`).
2.  **Verify Keys:** Ensure your `ZOTERO_API_KEY` has the necessary permissions (Read/Write) if using the online library.
3.  **Local Zotero:** If you have Zotero open but get 404s, double-check that you aren't accidentally hitting the cloud library with a dummy ID.

## "Antigravity" IDE Note

The term "Antigravity" as a Google IDE is not officially recognized. `Gefyra` is designed to be IDE-agnostic and relies on the Model Context Protocol (MCP) for communication, allowing integration with any MCP-compatible client or environment.

## License
ISC
