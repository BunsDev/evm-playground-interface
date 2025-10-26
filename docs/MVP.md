# SPEC-1-EVM Dev Interface MVP

## Summary

Deliver a **customizable developer interface** for interacting with EVM networks. The MVP combines a CLI tool and focused web workspace so builders can manage connections, call ABIs, deploy contracts, run scripts, and visualize call flows without context switching.

## Goals

- Provide a unified entry point for standard on-chain operations (reads, writes, deployments, script runs).
- Support rapid experimentation via modular UI panels and reusable CLI commands.
- Integrate the foundry-rs toolchain to align with existing developer workflows.
- Offer visual insight into contract interactions to speed debugging and review.

## Non-Goals (MVP)

- **Production-grade key custody**: limit to locally managed wallets and environment variables.
- **Bespoke block indexing pipeline**: rely on provider RPCs and explorer APIs.
- **Multi-tenant workspace management**: focus on single-user sessions.
- **Plugin marketplace**: expose internal extension points but defer external SDK packaging.

## Primary Personas

1. **Smart Contract Engineer**: needs to iterate on contract logic, run tests, and deploy to test/main nets.
2. **Backend/Integration Engineer**: focuses on monitoring events, scripting operational playbooks, and verifying data integrity.

## MVP Scope & Deliverables

### CLI Toolkit

- Workspace bootstrapper (`evm-playground init`) to scaffold config, RPC endpoints, and ABI directories.
- Contract interaction commands (`evm-playground call/send`) that wrap foundry `cast`/`forge` with opinionated defaults.
- Script runner (`evm-playground run <script>`) invoking foundry scripts with environment overlays.
- Artifact management (cache ABI/bytecode, fetch verified contracts via explorer APIs).

### Web Workspace

- **Network & Wallet Module**: provider selector, account switcher, live chain health status.
- **Contract Workbench**: ABI uploader, generated read/write panels, decoded responses, and transaction builder.
- **Transaction Monitor**: feed of recent sends with status, logs, traces, and export options.
- **Event Explorer**: subscription builder with filter presets and live log stream.
- **Deployment Flow**: guided form for forge deploy scripts with constructor validation and post-deploy verification checklist.
- **Visual Tracer**: call graph view for selected transactions/tests showing contract/function nodes and timeline.

### Shared Services

- Configuration layer for networks, accounts, and workspaces stored in lightweight persistence (JSON/SQLite).
- React Context providers to share session settings across components and CLI invocations.
- Logging + audit trail stored locally (rotating files) with hooks for future remote sinks.

## Architecture Overview

```text
┌────────────────┐      ┌────────────────────┐
│  Web Workspace  │◀────▶│  Local API Bridge  │◀────┐
└────────────────┘      └────────────────────┘     │
        ▲                         ▲                │
        │                         │                │
┌───────┴───────┐        ┌────────┴────────┐       │
│ React Context │        │ Node/TS Orchestr│       │
└───────▲───────┘        │  (foundry ffi)  │       │
        │                └────────▲────────┘       │
        │                         │                │
        │                ┌────────┴────────┐       │
        │                │  foundry-rs CLI │◀─────┘
        │                └────────▲────────┘
        │                         │
        │                ┌────────┴────────┐
        │                │   EVM Networks  │
        │                └────────────────┘
```

## Integrations & Dependencies

- **foundry-rs** (`forge`, `cast`) for compiling, testing, and transaction execution.
- **Explorer APIs** (Etherscan-compatible) for ABI retrieval and transaction metadata.
- **Wallet adapters** (MetaMask, WalletConnect, burner wallet).
- **Storage** via local SQLite/JSON for session data; optional S3-compatible blob store for artifacts (defer).

## Assumptions & Constraints

- Support Ethereum, Base, Polygon, Arbitrum, Optimism out of the box; additional chains configured through metadata files.
- Local private key handling only; no remote signing or MPC flows.
- Minimum Node.js 20 runtime; CLI distributed via pnpm/npx.
- Visualizations rendered client-side; heavy trace parsing performed in Node worker threads.

## User Journeys

1. **Deploy & verify**
   - Initialize workspace → load constructor params → run deployment script → view confirmation & post-deploy checklist.
2. **Debug failing transaction**
   - Import ABI → replay transaction → inspect decoded logs and call graph → export summary for teammates.
3. **Monitor events**
   - Configure filters → stream events in dashboard → trigger local script when conditions met → export CSV report.

## Success Metrics

- Setup-to-first-contract-call in under 10 minutes for a new workspace.
- Foundry script parity: 100% of existing scripts runnable without modification.
- Visual tracer adopted in ≥3 critical debugging sessions during pilot.

## Risks & Mitigations

- **Network variability:** unreliable RPCs can break workflows → allow backup endpoints and quick switching.
- **Security exposure:** local key misuse risk → ship warnings, environment templates, and quick key revocation tooling.
- **Trace complexity:** large call graphs may overwhelm UI → implement progressive disclosure and search/filtering.
- **Scope creep:** plugin ecosystem demand → document extension points but defer external API until post-MVP.

## Milestones (aligned with `docs/STAGES.md`)not

1. Platform foundations & connectivity (Stages 0–1).
2. Contract workbench & monitoring (Stages 2–3).
3. Deployment, automation, and visualization (Stages 4–5).
4. Collaboration guardrails (Stage 6, post-MVP stretch).

## Open Questions

- Preferred packaging for CLI (pnpm global install vs. standalone binary)?
- Which explorer APIs to prioritize (Etherscan, Blockscout, custom indexers)?
- Do we need offline mode with cached state for air-gapped environments?
- What compliance requirements (if any) apply to stored transaction data?

## Next Actions

- Define detailed EPICs per stage with acceptance criteria.
- Prototype ABI panel generation and foundry script runner.
- Validate visual tracer UX with design mockups or low-fidelity diagrams.
- Gather pilot developer feedback to refine non-goals and stretch targets.
