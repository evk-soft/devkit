import fs from "node:fs";
import path from "node:path";

const isBun = typeof globalThis.Bun !== "undefined" || Boolean(process?.versions?.bun);
const runtime = isBun ? `bun@${process.versions.bun}` : `node@${process.version}`;

const root = path.resolve(new URL(".", import.meta.url).pathname, "..", "..");

function assertFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${rel}`);
  }
}

assertFile("package.json");
assertFile("pnpm-workspace.yaml");
assertFile("packages/tsconfig/package.json");
assertFile("packages/biome-config/package.json");

console.log(`[devkit] runtime-check ok (${runtime})`);

