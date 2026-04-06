# Gefyra V3.1 - Release Notes ("The Librarian")

**Version**: 3.1.0
**Date**: April 6, 2026
**Codename**: "The Librarian"

### 🚀 New Structural Diagnostics
- **Library Tag Dictionary**: Added `zotero_list_tags`. Get the complete list of all tags used across your entire research database.
- **Hierarchical Collection Tree**: Added `zotero_get_collection_tree`. Visualize your collection architecture exactly as it appears in the Zotero desktop app.
- **High-Level Statistics**: Added `zotero_get_library_stats`. Instantly view the health of your library with counts for items, tags, collections, and even the current trash bin size.

### 🛠 Improvements
- **Core versioning alignment**: Synced server internal versioning across all documentation for architecture consistency.

---

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
