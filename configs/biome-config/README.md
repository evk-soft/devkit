# @evk-soft/biome-config

Shareable [Biome](https://biomejs.dev) presets for JavaScript/TypeScript projects.

## Install

```bash
pnpm add -D @biomejs/biome @evk-soft/biome-config
```

## Use

Create `biome.json` in your repo:

```json
{
  "extends": ["@evk-soft/biome-config/presets/base"]
}
```

## Presets

- `base`: baseline formatting + lint rules (recommended as the first preset)
- `typescript`: TypeScript-specific rules and overrides
- `node`: Node.js globals and Node-focused rules
- `bun`: Bun globals and Bun-focused rules
- `react`: React/JSX a11y + correctness rules
- `imports`: import-related rules (e.g. unused imports)
- `test`: relaxed rules for tests
- `strict`: stricter rules (good for libraries/production)
