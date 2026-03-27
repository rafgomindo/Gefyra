# Gefyra V2 - Release Notes (Perfection Update)

**Version**: 2.0.0
**Date**: March 27, 2026
**Codename**: "Perfection"

### 🚀 New Features
- **Deep PDF Text Extraction**: Added `zotero_get_fulltext` tool. It automatically finds the PDF attachment of a Zotero item, downloads it, and extracts the text for AI analysis.
- **Bi-Directional Research Notes**: Added `zotero_add_note` tool. Now the AI can push synthesized research insights directly back into your Zotero library as child notes.
- **Precise Citation Mapping**: Added `zotero_get_citekey` to fetch official Better BibTeX keys or generate standard ones, ensuring zero-hallucination in Markdown documents.

### 🛠 Improvements
- **ESM/CJS Hybrid Support**: Re-engineered the project to support modern Node.js modules while maintaining compatibility with critical libraries like `pdf-parse`.
- **Enhanced Error Handling**: Improved diagnostics for missing attachments or invalid API keys.

### 📦 Dependencies
- Added `pdf-parse` for full-text processing.
- Updated `@modelcontextprotocol/sdk` to the latest version.
