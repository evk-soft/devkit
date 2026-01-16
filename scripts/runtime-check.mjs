import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isBun = typeof globalThis.Bun !== "undefined" || Boolean(process?.versions?.bun);
const runtime = isBun ? `bun@${process.versions.bun}` : `node@${process.version}`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assertFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${rel}`);
  }
}

assertFile("package.json");
assertFile("pnpm-workspace.yaml");
assertFile("configs/config-typescript/package.json");
assertFile("configs/config-biome/package.json");

console.log(`[devkit] runtime-check ok (${runtime})`);

