# devkit

Monorepo for **@evk-soft** dev tooling: **Biome presets**, **TypeScript configs**, and **AI rules**.

## Requirements

- **Node.js**: **24 LTS+**
- **pnpm**: via Corepack (recommended)
- **Bun**: **1.3+** (optional runtime support)

## Quick start

```bash
corepack enable
corepack prepare pnpm@10 --activate
pnpm install
pnpm check
```

## Packages

- `@evk-soft/tsconfig` — shareable TS config presets
- `@evk-soft/biome-config` — Biome config preset(s)

## Runtime support (Node + Bun)

- **pnpm is the package manager** for this repo.
- **Node 24 LTS** is the primary runtime for tooling.
- **Bun** is supported as an *optional runtime* (CI runs a Bun job to ensure basic compatibility).
