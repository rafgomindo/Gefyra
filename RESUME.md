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

### Architecture
- **Language**: TypeScript (Node.js)
- **Protocol**: Model Context Protocol (MCP)
- **API**: Zotero Web API v3
- **Git State**: Up-to-date (V2.0.0)
