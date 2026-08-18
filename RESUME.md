# Gefyra (Γέφυρα) - Project Resume

**Gefyra** (Greek for "Bridge") is a specialized Model Context Protocol (MCP) server designed specifically for the **#Doctorat: El Ejido** thesis project. It acts as an intelligent bridge between the Zotero bibliographic database and the AI assistant.

### Core Value Proposition
Gefyra eliminates "Citation Hallucination" by providing the AI with direct, real-time access to the researcher's local and cloud library. It enables "High-Density Masterwork" prose by allowing the AI to read the actual PDF sources cited in the thesis.

### Active Tools
1. **`zotero_search`**: Live search of the library.
2. **`zotero_get_item`**: Complete metadata retrieval.
3. **`zotero_get_fulltext`**: Deep PDF content extraction.
4. **`zotero_add_note`**: AI-to-Library research syncing.
5. **`zotero_get_citekey`**: Zero-error marker generation.
6. **`zotero_list_tags`**: Full tag dictionary retrieval.
7. **`zotero_get_collection_tree`**: Hierarchical structural map of the library.
8. **`zotero_get_library_stats`**: High-level database metrics and health.
9. **`zotero_find_duplicates`**: Read-only duplicate-cluster scan with keeper scoring.
10. **`zotero_get_citation`**: Formatted bibliography entry in any CSL style (not just BibTeX).
11. **`zotero_batch_update_items`** / **`zotero_batch_add_tags`**: Bulk operations across many items in one call.

### Architecture
- **Language**: TypeScript (Node.js)
- **Protocol**: Model Context Protocol (MCP)
- **API**: Zotero Web API v3
- **Reliability**: Automatic retry with backoff on 429/503 responses; `GEFYRA_READ_ONLY` guardrail mode; personal or group library support
- **Git State**: Up-to-date (V3.3.0 - "The Librarian")
