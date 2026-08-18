# Gefyra (Γέφυρα) - v3.3.0 (The Librarian Edition) 🌉📚🦾🔩

![Academic](https://img.shields.io/badge/Academic-Zotero-red?style=for-the-badge) ![AI](https://img.shields.io/badge/AI-Agentic--Bridge-blue?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-3.3.0--Librarian-emerald?style=for-the-badge)

### 🏷️ **Project Tags**
`#TalkToZotero` `#TalkToYourLibrary` `#IA` `#Zotero` `#IABridge` `#Gefyra` `#ResearchAutomation` `#LibraryDiagnostics`

**"Do you want your IA or your IDE (Gemini, Claude, ChatGPT, Cursor, Windsurf) to be able to interact with your Zotero library, be it local or cloud? Just install Gefyra and it will!"** 🚀

**Gefyra (Γέφυρα):** The definitive and indestructible **Bridge between IA and Zotero**. Built specifically for high-level **Doctoral Research** and high-integrity academic data workflows.

---

## ⚡ Quick Start: Ready in 60 Seconds

### 1. Install
```bash
git clone https://github.com/rafgomindo/Gefyra.git
cd Gefyra
npm install
npm run build
```
This compiles the TypeScript source into `build/` — that's the `index.js` you'll point your AI client at in step 4.

### 2. Requirements
To use the full power of Gefyra's citation and searching capabilities, you MUST have the following installed in your Zotero:
*   [**Better BibTeX for Zotero**](https://retorque.re/zotero-better-bibtex/): This allows Gefyra to generate professional-grade BibTeX keys and citations instantly. 🧬

### 3. Get Your Credentials
You need two pieces of information from your Zotero account:
*   **User ID**: Found at the top of your [Zotero API Settings](https://www.zotero.org/settings/keys). (It is a numeric ID, e.g., `1234567`).
*   **API Key**: Create a new private key at [zotero.org/settings/keys](https://www.zotero.org/settings/keys). Make sure to check **"Allow library access"**. 🔑

### 4. Setup
Gefyra works as an **MCP Server** (Model Context Protocol). Add it to your AI configuration (like Gemini CLI, Claude Desktop, or Cursor), pointing `args` at the absolute path to the `build/index.js` you just compiled:

```json
"gefyra": {
  "command": "node",
  "args": ["/path/to/gefyra/build/index.js"],
  "env": {
    "ZOTERO_USER_ID": "XXXXXXX",
    "ZOTERO_API_KEY": "YOUR_KEY_HERE"
  }
}
```

### 5. Verify it's working
Two ways to confirm the connection before you rely on it:
*   **From the command line, no AI client needed**: `node build/index.js --audit` prints your active and trashed item counts and exits. If you see real numbers, your credentials and connection are correct.
*   **From your AI client**: after restarting it with the config above, ask it to call `zotero_get_library_stats` (or just ask "how many items are in my Zotero library?"). Real numbers back means it's wired up correctly. If it fails, check the server's stderr log — Gefyra prints `Gefyra vX.X.X running. UID: ..., API key configured: true/false` on every start, which tells you immediately whether your env vars actually reached the process.

#### Optional environment variables
| Variable | Default | Purpose |
|---|---|---|
| `ZOTERO_LIBRARY_TYPE` | `user` | Set to `group` to point Gefyra at a shared Zotero group library instead of your personal one. |
| `ZOTERO_LIBRARY_ID` | (your `ZOTERO_USER_ID`) | The group ID when `ZOTERO_LIBRARY_TYPE=group`. |
| `GEFYRA_READ_ONLY` | unset | Set to `true` to disable every write tool (create/update/trash/tag/fuse/associate/upload). Search and read tools keep working. |
| `ZOTERO_LOCAL_URL` | `http://localhost:23119` | Override the local Zotero desktop API address. |
| `ZOTERO_CLOUD_URL` | `https://api.zotero.org` | Override the Zotero Cloud API address. |

**Local vs. Cloud, automatically:** you never choose one or the other. For read operations, Gefyra first tries the Zotero desktop app's local API (fast, no rate limits) if it's running, and silently falls back to the Zotero Cloud API if it isn't — or if the request needs cloud-only features like `qmode` search or large result limits. All write operations always go to the Cloud API, since the local API doesn't support them. This is why `ZOTERO_API_KEY` is required even if you mainly use Zotero Desktop: it's your fallback and the only path for writes.

---

## 🚀 The Librarian Toolset (v3.3.0)

Gefyra now exposes powerful atomic tools directly to your AI agent:

### 🛡️ Read-only mode
Set `GEFYRA_READ_ONLY=true` in the server's `env` block to hand Gefyra to an AI agent without risking your live library — every write tool (`zotero_create_item`, `zotero_update_item`, `zotero_trash_item`, `zotero_add_tags`, `zotero_fuse_items`, `zotero_associate_items`, `zotero_upload_file`, batch tools, etc.) refuses immediately with a clear error, before making any network call. Search, get, and `zotero_find_duplicates` keep working normally.

### 👥 Group library support
Point Gefyra at a shared Zotero group library (e.g. a doctoral committee or co-authored library) instead of your personal one via `ZOTERO_LIBRARY_TYPE=group` + `ZOTERO_LIBRARY_ID`. All tools work the same way against the group library; the local-desktop fast path is skipped automatically since the local Zotero API only serves your personal library.

### 📦 `zotero_batch_update_items` / `zotero_batch_add_tags`
Update or tag many items in a single tool call instead of one call per item. Each item is applied independently and reports its own success/failure, so one bad update doesn't abort the rest of the batch.

### 📚 `zotero_get_citation`
Get a formatted bibliography entry in any CSL style Zotero supports (`apa`, `chicago-author-date`, `mla`, `ieee`, ...) — not just BibTeX.

### 📤 `zotero_upload_file`
Push local files directly into your Zotero Cloud. 
- **Auto-Parenting**: Attach files to any existing Zotero item via its key.
- **Protocol Compliance**: Implements the full Zotero-S3 upload handshake (Authorize → Upload → Register).
- **MIME Intelligence**: Automatically detects PDF, EPUB, DOCX, etc.

### 🧊 `zotero_fuse_items`
Directly merge duplicate items from your AI chat.
- **Master Selection**: Specify one item to keep and multiple to merge.
- **Recursive Move**: Automatically reparents all attachments and notes to the master item.
- **Trash-on-Complete**: Moves empty duplicates to trash automatically.

### 🤝 `zotero_associate_items`
Expert-level library organization:
- **Reparenting**: Turn orphan attachments into children of a proper reference entry.
- **Lateral Linking**: Create "Related Item" (`owl:sameAs`) links between top-level entries.

### 🔎 `zotero_find_duplicates`
Read-only duplicate scan, callable live from your AI chat.
- **Clustering**: Groups items by canonicalized title, creators, year, and type.
- **Scoring**: Suggests a keeper per cluster based on metadata richness and attachment count.
- **Non-destructive**: Only reports candidates — pair with `zotero_fuse_items` to actually merge.

---

## 📉 Batch Automation & JSON Proposals

For large libraries, Gefyra uses a "Propose → Audit → Apply" workflow using side-scripts:

1.  **Detection**: Run `python scripts/detect_duplicates.py` or `python scripts/detect_parts.py`.
2.  **Proposals**: These scripts generate `duplicate_fusion_proposals.json` or `part_fusion_proposals.json`.
3.  **Execution**: Review the JSONs, then run `npm run build && node build/execute_fusion.js` (or `execute_part_fusion.js`) to apply changes in bulk.

The one-off audit/detection/rehabilitation scripts used for library maintenance live in [`scripts/`](scripts/); the MCP server itself is just `src/index.ts` and `src/zotero-client.ts`. All scripts read `ZOTERO_USER_ID`/`ZOTERO_API_KEY` from the environment (copy `.env.example` to `.env` and fill it in, or export them in your shell) — they no longer contain embedded credentials.

For a quick, non-destructive duplicate check without running any script, just ask your AI agent to call the `zotero_find_duplicates` tool instead.

### 📂 Key JSON Formats
- **`rehabilitation_proposals.json`**: Generated by `scripts/propose_rehabilitation.py` for orphan recovery.
- **`parent_rehabilitation_proposals.json`**: For patching titles of parent entries based on their PDF content.

---

## 🧪 Development

```bash
npm run build   # Compile TypeScript to build/
npm test        # Compile, then run the unit tests
```

---

## 🤖 The Universal IA-Agentic Bridge
Gefyra provides a seamless interface for all major Large Language Models:
*   **Gemini (Antigravity/CLI)**: Full native integration. 🚀
*   **Claude (Desktop/Dev)**: High-speed metadata retrieval.
*   **ChatGPT (Custom GPTs)**: Via standard MCP relay.
*   **Moxie / Cursor / Windsurf**: IDE-integrated research assistant connectivity.

---
Created and Maintained by **Rafael Domingo Ramones**. 🌉
**Gefyra: Build your bridge on steel foundations.** 🦾🔩
