# @evk-soft/config-biome

Biome preset(s) for **@evk-soft** projects.

## Usage

Biome doesn’t automatically “extend” configs from `node_modules` in the same way ESLint does.
Two common ways to use this package:

- Copy the preset into your repo and customize it.
- Point Biome at this config when running commands:

```bash
biome check --config-path ./node_modules/@evk-soft/config-biome/biome.json .
```

