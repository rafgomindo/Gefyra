# 🏗️ Gefyra: The Evolution Log

Track the development, iterative fixes, and state-of-the-art updates of the Gefyra MCP Server.

## 🚀 v2.1.4: The "Smart Cloud" Patch (2026-04-03)
**Primary Focus**: Enterprise-grade stability and large-scale deduplication support.

*   **Smart Request Routing**: Implemented logic to intelligently bypass the Local Zotero API and route complex searches or high-limit batches (limit > 50) directly to the Zotero Cloud. This prevents "400 Bad Request" errors caused by local API limitations.
*   **Authentication Hardening**: Switched to the explicit `Zotero-API-Key` header instead of `Authorization: Bearer` to ensure 100% compatibility across all Zotero Cloud endpoints.
*   **API Version Pinning**: Enforced `Zotero-API-Version: 3` across all calls to align with Zotero's production standards.

## 🧬 v2.1.3: The Wildcard Fix (2026-04-03)
**Primary Focus**: Enabling broad library scans.

*   **Parameter Sanitization**: Fixed a critical bug where `qmode` was being sent even when no search query (`q`) was present. The Zotero API now correctly interprets "List Everything" requests.
*   **Flexible Search**: Optimized the `searchItems` method to handle empty strings and wildcard patterns, essential for the deduplication workflow.

## 🛠️ v2.1.2: Header & Authentication Refinement (2026-04-03)
*   Initial adjustments to the `Axios` client configuration to handle cloud vs local instance separation.

## 📦 v2.1.1: Early Connectivity Patch (2026-04-03)
*   Resolved initialization issues with environment variables in the Gefyra kernel.

## 📜 v2.1.0: Deduplication & Better BibTeX Integration (2026-04-03)
*   **First Release for Thesis Deduplication**: Introduced tools specifically designed to identify and manage redundant entries in large collections.
