# devkit

Monorepo for @evk-soft dev tooling: Biome presets, TypeScript configs, and AI rules.

## Getting started

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

The pnpm version is pinned by `packageManager` in the root `package.json`; corepack activates it, so
you do not install pnpm yourself. Behavioural pnpm settings live in `pnpm-workspace.yaml`, not in
`.npmrc` — pnpm 11 reads `.npmrc` for registry and auth only.

## One-time step when you first pull the pnpm 11 upgrade

Your first `git pull` or branch switch across the pnpm 10 -> 11 change will run the `post-merge` hook,
and that install **will fail** with:

```text
ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY
```

This is expected and happens exactly once per machine. A pnpm major upgrade must replace a
`node_modules` laid out by the previous major, and it refuses to do that silently when it cannot ask.
Remove the directories and install again:

```bash
find . -name node_modules -maxdepth 3 -type d -prune -exec rm -rf {} +
pnpm install --frozen-lockfile
```

On Windows PowerShell:

```powershell
Get-ChildItem -Recurse -Directory -Filter node_modules -Depth 2 | ForEach-Object { Remove-Item -Recurse -Force $_.FullName }
pnpm install --frozen-lockfile
```

The hook is deliberately left as-is rather than silenced. Suppressing the prompt permanently — with
`confirmModulesPurge: false` or `CI=true` — would remove a real safety check for every future install
in order to smooth a single transition, and the hook failing loudly is an honest signal that the
dependency tree needs attention.

## Repository checks

| Command | What it proves |
|---|---|
| `pnpm check` | formatter and linter, runtime smoke, and the full `@evk-soft/ai-tooling` gate |
| `pnpm run check:structure` | no dependency cycle, no relative import escaping its workspace |
| `pnpm run check:supply-chain` | no high or critical advisory, no disallowed dependency licence |
| `pnpm run changelog:check` | every `changelog.d/` fragment is well-formed |
