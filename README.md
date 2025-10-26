# EVM Playground Interface

EVM Playground Interface is a modular workspace for experimenting with Ethereum Virtual Machine (EVM) flows. It blends standard account, transaction, and contract tooling with experimental sandboxes so teams can template, automate, and validate ideas in one full-stack surface.

## Core Concepts

- **Standard tooling, streamlined** – Manage accounts, deploy contracts, and inspect state changes with sane defaults for common networks.
- **Experimental sandboxes** – Fork networks, prototype opcodes, and test hypotheses without leaving the browser-based workspace.
- **Composable modules** – Rearrange interface panels for transactions, storage, events, analytics, and more to match individual workflows.
- **Template-driven testing** – Share reusable suites that connect UI interactions, scripts, and network automation for rapid iteration.

## Tech Stack

- [Next.js 16](https://nextjs.org) App Router running on [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com) with inline theme tokens
- Planned UI components built with [shadcn/ui](https://ui.shadcn.com)
- Fonts served through [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) (Geist Sans & Mono)
- TypeScript-first configuration with ESLint (Airbnb flavored via `eslint-config-next`)

## Project Layout

```text
app/
├── layout.tsx      # Root layout, font configuration, metadata
└── page.tsx        # Landing hero describing the modular EVM playground

public/             # Static assets (logos, icons)
tailwind.config     # Tailwind v4 inline theme defined in app/globals.css
```

Upcoming routes such as `/workspace` (interactive modules) and `/docs` (pattern library) are linked from the home page and will land in the `app/` directory as additional segments.

## Scripts

| Command        | Description |
| -------------- | ----------- |
| `pnpm dev`     | Start the Next.js development server with hot module reload. |
| `pnpm lint`    | Run ESLint against the project using the Next.js config. |
| `pnpm build`   | Generate an optimized production build. |
| `pnpm start`   | Serve the previously built production bundle. |
| `pnpm bdev`    | Convenience script to build and immediately start the production server. |

> **Note:** The workspace uses `pnpm` as the package manager. Install dependencies once with `pnpm install`.

## Development Workflow

1. Install dependencies: `pnpm install`
2. Run the dev server: `pnpm dev`
3. Visit [http://localhost:3220](http://localhost:3220) to explore the home experience.
4. Use `app/page.tsx` to evolve the hero and feature descriptions, or add new routes under `app/` for specialized modules.
5. Before pushing, run `pnpm lint` and `pnpm build` to ensure the codebase is clean and production-ready.

## Architecture Notes

- **App Router-first** – The project follows Next.js App Router conventions; each folder under `app/` becomes a route segment, enabling server and client component composition.
- **State management** – React Context will back shared state across modules (e.g., selected network, account, and experiment settings) as features expand.
- **Styling** – Tailwind utility classes provide rapid iteration. Shared design tokens live in `app/globals.css`, keeping themes consistent between light and dark modes.
- **Extendable modules** – Future panels (accounts, transactions, logs, analytics) will be delivered as composable client components that can be rearranged per workspace template.

## Contributing

Issues, feature ideas, and documentation improvements are welcome. The goal is to make experimenting with EVM workflows approachable for both standard production tasks and cutting-edge research.

## Inspiration

This project is inspired by [viem-playground](https://github.com/stephancill/viem-playground) and [foundry-playground](https://github.com/stephancill/foundry-playground).
