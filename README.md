# Gefyra (Γέφυρα) - v1.1.0 (Hermes) 🌉

**Gefyra (Γέφυρα):** A Model Context Protocol (MCP) server that bridges your Zotero research library with AI assistants that use integrated development environments (IDE). 

Created by **Rafael Domingo Ramones**. 🌉

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

1.  **Log in to Zotero**: Go to [zotero.org/settings/keys](https://www.zotero.org/settings/keys).
2.  **Take note of your User ID**: At the top of that page, you will see: *"Your userID for use in API calls is **XXXXXXX**"*. **Save this number**—it is a 7-digit numeric ID, not your username.
3.  **Create a New Private Key**: 
    *   Click **"Create new private key"**.
    *   Provide a description (e.g., "Gefyra MCP Server").
    *   **Important**: Ensure the **"Allow library access"** checkbox is selected.
    *   Click **"Save Key"** and **immediately copy the key string**. You will not be able to see it again once you leave the page.

### Step 2: Set Environment Variables

Before running `gefyra`, you must set the `ZOTERO_USER_ID` and `ZOTERO_API_KEY` environment variables.

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

### Local vs. Cloud - How to Choose?

Gefyra version **1.2.0** now prioritizes your local library for maximum speed and privacy.

**Finding your Local URL:**
If you have the Zotero Desktop app open, Gefyra will automatically try to reach it. 
-   **Method A (Standard)**: Most users with plugins like **Better BibTeX** should set `ZOTERO_LOCAL_URL` to `http://localhost:23119`.
-   **Method B (Bridge)**: If you use a dedicated [Zotero Bridge](https://github.com/mose/zotero-bridge), set it to `http://localhost:8080`.
-   **Failover**: If Gefyra can't reach your local app (e.g. if it's closed), it will automatically fall back to **Zotero Cloud** using your `ZOTERO_USER_ID` and `ZOTERO_API_KEY`.

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
1.  **Check 404 Errors:** This usually means your `ZOTERO_USER_ID` or the requested `itemId` is incorrect. If you're trying to use local Zotero, ensure your `ZOTERO_LOCAL_URL` points to an active bridge.
2.  **Verify Keys:** Ensure your `ZOTERO_API_KEY` has **Read/Write** permissions (if using Cloud).
3.  **Local Discovery:** If you have Zotero open but get 404s, try searching with `http://localhost:23119` or `http://localhost:8080` to see which is active.

## Credits

Created by **Rafael Domingo Ramones**. 🌉

## License
ISC
