# Gefyra (Γέφυρα) - v3.0.0 (The Architect Edition) 🌉🦾🔩

![Academic](https://img.shields.io/badge/Academic-Zotero-red?style=for-the-badge) ![AI](https://img.shields.io/badge/AI-Agentic--Bridge-blue?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-3.0.0--Architect-gold?style=for-the-badge)

### 🏷️ **Project Tags**
`#TalkToZotero` `#TalkToYourLibrary` `#IA` `#Zotero` `#IABridge` `#Gefyra` `#ResearchAutomation`

**"Do you want your IA or your IDE (Gemini, Claude, ChatGPT, Cursor, Windsurf) to be able to interact with your Zotero library, be it local or cloud? Just install Gefyra and it will!"** 🚀

**Gefyra (Γέφυρα):** The definitive and indestructible **Bridge between IA and Zotero**. Built specifically for high-level **Doctoral Research** and high-integrity academic data workflows.

---

## ⚡ Quick Start: Ready in 60 Seconds

### 1. Requirements
To use the full power of Gefyra's citation and searching capabilities, you MUST have the following installed in your Zotero:
*   [**Better BibTeX for Zotero**](https://retorque.re/zotero-better-bibtex/): This allows Gefyra to generate professional-grade BibTeX keys and citations instantly. 🧬

### 2. Get Your Credentials
You need two pieces of information from your Zotero account:
*   **User ID**: Found at the top of your [Zotero API Settings](https://www.zotero.org/settings/keys). (It is a numeric ID, e.g., `7679932`).
*   **API Key**: Create a new private key at [zotero.org/settings/keys](https://www.zotero.org/settings/keys). Make sure to check **"Allow library access"**. 🔑

### 3. Setup
Gefyra works as an **MCP Server** (Model Context Protocol). Add it to your AI configuration (like Gemini CLI, Claude Desktop, or Cursor):

```json
"gefyra": {
  "command": "node",
  "args": ["/path/to/gefyra/build/index.js"],
  "env": {
    "ZOTERO_USER_ID": "XXXXXXX",
    "ZOTERO_API_KEY": "YOUR_KEY_HERE",
    "ZOTERO_BASE_URL": "https://api.zotero.org"
  }
}
```

---

## 🤖 The Universal IA-Agentic Bridge
Gefyra provides a seamless interface for all major Large Language Models:
*   **Gemini (Antigravity/CLI)**: Full native integration. 🚀
*   **Claude (Desktop/Dev)**: High-speed metadata retrieval.
*   **ChatGPT (Custom GPTs)**: Via standard MCP relay.
*   **Moxie / Cursor / Windsurf**: IDE-integrated research assistant connectivity.

## 🚀 Autonomous Maintenance Suite (Architect Grade)
Gefyra v3.0.0 is more than a bridge—it is an **Autonomous AI Librarian** capable of self-healing your database:

*   **🧬 Metadata Rescue (DOI Auto-Fetch)**: Scans generic fragments like "Untitled", extracts DOIs from the PDF binary, and retrieves elite-level metadata via **CrossRef**.
*   **🧱 Structural Part-Fusion**: Intelligently identifies and merges split volume segments into single, professional Master Entries.
*   **🔭 Zero-Orphan Protocol**: A deep audit system ensuring 100% attachment parenting across the library.
*   **📐 Barbaric Title Remediation**: Detects and fixes "paragraph-length" OCR title artifacts.

---
Created and Maintained by **Rafael Domingo Ramones**. 🌉
**Gefyra: Build your bridge on steel foundations.** 🦾🔩
