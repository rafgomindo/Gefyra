# 🏗️ Gefyra: The Evolution Log

Track the development, iterative fixes, and state-of-the-art updates of the Gefyra MCP Server.

## 🔒 v3.2.1: The Hardening Patch (2026-08-18)
**Primary Focus**: Security cleanup and correctness fixes across the core server.

*   **Credential Leak Removed**: A live Zotero API key was hardcoded in plaintext across 12 diagnostic/audit scripts (`forensic_restore.ts` and 11 root-level Python scripts) and committed to git history. All 12 files now read `ZOTERO_API_KEY`/`ZOTERO_USER_ID` from the environment instead. If you maintain a fork or clone of this repo, rotate any key that was ever committed to it.
*   **No More Hardcoded Personal Fallback**: `src/index.ts` previously fell back to the maintainer's own Zotero User ID if `ZOTERO_USER_ID` was unset. It now warns and requires the caller to configure it.
*   **Fixed `zotero_get_library_stats` Item Count**: The tool was reporting an item's *version number* as the *item count* (`parseInt(items[0].version)`). It now reads the correct total from the Zotero API's `Total-Results` header.
*   **New Tool — `zotero_find_duplicates`**: The duplicate-detection/scoring logic that previously only existed as a destructive CLI flag (`--dedupe`) is now also exposed as a read-only MCP tool, so an AI agent can inspect duplicate clusters live without running a side script or touching the library.
*   **Reduced Duplication**: Consolidated `getChildren`/`getItemChildren` into one implementation, removed the `zotero_raw_request` tool's unsafe `as any` cast to a private method (now a proper public `rawRequest`), and unified the scattered version strings (`v2.1.4-FINAL-REV5`, `v2.1.12`, `3.1.0`) into a single `3.2.1`.
*   **First Test Coverage**: Added `src/utils.test.ts` (Node's built-in test runner) covering title canonicalization and filename metadata parsing — the project previously had zero automated tests.

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
