# DATABASE

## Plan

### Proposed approach

1. Schema expansion

    - [x] Extend [lib/abiDatabase.ts](lib/abiDatabase.ts) (or a new module) to include tables: chains, contracts, abi_mappings, snippets, scripts.
    - [x] Define Dexie interfaces/types (chain metadata, contract metadata, address mapping keyed by chain, snippet categories, etc.).
    - [x] Bump database version and add populate hooks for initial data (minimal ERC‑20 ABI, sample contract, example address per chain, snippet bundles).

2. Default code assets

    - [x] Prepare a curated snippets set (e.g., provider setup, ERC20 balance, write transaction, event listener).
    - [x] Store reusable script templates in code (for non-DB defaults) and ensure getDefaultScriptContent() references the new library.

3. Playground wiring

    - [ ] Update the playground to load snippets/contracts from Dexie (with fallback to static defaults if DB unavailable).
    - [ ] Expose snippet picker & contract list in the UI (or at least ensure data structures are ready).

4. Documentation

    - [ ] Expand [docs/DATABASE.md](docs/DATABASE.md) with: ER diagram, table definitions, seed data, migration strategy, extension guidelines, reasons for Dexie layout.

5. Testing & linting

    - [ ] Add unit coverage for new data helpers.
    - [ ] Run pnpm lint / pnpm test to confirm no regressions.

## Implementation

### Current status

- Dexie version bumped to `2` with tables for chains, contracts, ABIs, scripts, snippets, and contract addresses, including populate + upgrade seeding hooks. @/lib/abiDatabase.ts#311-360
- Seed data added for two reference chains, a sample ERC-20 contract, contract addresses per chain, curated code snippets, and starter scripts. @/lib/abiDatabase.ts#109-308
- `Stored*` interfaces declared alongside shared seed helpers to ensure timestamps are written consistently. @/lib/abiDatabase.ts#4-108
- `getDefaultScriptContent()` now ships a viem bootstrap template aligned with the new chain structure. @/lib/scriptStorage.ts#10-51

### Follow-ups

1. Update ABI creation flows to capture or generate the required `slug` key (currently causes a type error when calling `abiDb.abis.add`).
2. Decide whether `getDefaultScriptContent()` should load from `scriptDb` seeds instead of a static string and wire the runtime to read defaults from Dexie when available.
3. Implement playground UI for selecting seeded snippets/scripts and fall back gracefully when the database is unavailable.
4. Expand this document with an ER diagram, table-by-table field reference, migration guidance, and testing strategy.
