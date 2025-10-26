# Stages

## Stage 0 – Platform Foundations

- [ ] Finalize project scaffolding (Next.js App Router, Tailwind, shadcn/ui baseline).
- [ ] Establish shared design tokens and typography for light/dark theming.
- [ ] Configure environment management for RPC endpoints, wallets, and secrets.
- [ ] Set up linting, formatting, and CI build checks to keep contributions consistent.

## Stage 1 – Network Connectivity & Accounts

- [ ] Integrate a provider selector (public RPC, custom RPC, local anvil/foundry node).
- [ ] Implement wallet adapters (Metamask, WalletConnect, embedded burner wallet) with network switching safeguards.
- [ ] Surface network health indicators (chain ID, block height, gas price snapshots).
- [ ] Persist recently used networks and accounts via React Context + storage.

## Stage 2 – Contract Workbench

- [ ] Build ABI loader (upload JSON, paste ABI, fetch from Etherscan/Explorer APIs).
- [ ] Render dynamic read/write method panels with input validation and calldataless simulation.
- [ ] Support contract instantiation utilities (address book, ENS resolution, deploy history).
- [ ] Provide response viewers for reads (raw JSON, decoded types, custom formatters).

## Stage 3 – Transaction Review & Event Monitoring

- [ ] Stream recent transactions for the active account/contract with status badges.
- [ ] Add pending/confirmed transaction detail drawers (logs, traces, gas usage).
- [ ] Implement event listeners with filter builders and live log streams.
- [ ] Allow exporting monitored events/transactions to CSV or webhooks.

## Stage 4 – Deployment & Automation

- [ ] Offer guided contract deployment (constructor params, libraries, upgrade proxy toggles).
- [ ] Integrate Foundry (forge) scripts: configure workspaces, compile artifacts, run scripts from UI.
- [ ] Generate repeatable script templates for migrations, seeding, and on-chain tasks.
- [ ] Schedule or trigger script execution via UI actions or CLI bridge.

## Stage 5 – Testing & Visualization

- [ ] Visualize contract call sequences with node-link diagrams and timeline playback.
- [ ] Display storage diffs and event emission flows per invocation.
- [ ] Execute Foundry test suites from the interface, streaming console output and traces.
- [ ] Capture and persist scenario snapshots for regression comparison.

## Stage 6 – Collaboration & Guardrails

- [ ] Enable workspace templates that bundle panels, saved calls, and scripts for reuse.
- [ ] Add role-based access or protected mode for production-connected workspaces.
- [ ] Implement auditing hooks (activity logs, exportable session histories).
- [ ] Document extension points for custom modules and third-party integrations.
