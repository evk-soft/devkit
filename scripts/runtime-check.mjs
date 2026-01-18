import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isBun =
  typeof globalThis.Bun !== "undefined" || Boolean(process?.versions?.bun);
const runtime = isBun
  ? `bun@${process.versions.bun}`
  : `node@${process.version}`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assertFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${rel}`);
  }
}

assertFile("package.json");
assertFile("pnpm-workspace.yaml");
assertFile("biome.json");
assertFile("configs/biome-config/package.json");
assertFile("configs/typescript-config/package.json");
assertFile("packages/runtime-detect/package.json");

console.log(`[devkit] runtime-check ok (${runtime})`);
