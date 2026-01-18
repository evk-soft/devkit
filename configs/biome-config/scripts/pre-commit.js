#!/usr/bin/env node

/**
 * Validates that every preset JSON file in ./presets is valid JSON.
 * This is useful as a lightweight pre-commit check.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const presetsDir = resolve(__dirname, "..", "presets");

function validateJsonFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  JSON.parse(content);
}

function main() {
  const entries = readdirSync(presetsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  if (entries.length === 0) {
    console.error("No preset files found in presets/.");
    process.exit(1);
  }

  let hasErrors = false;

  for (const name of entries) {
    const filePath = resolve(presetsDir, name);
    try {
      validateJsonFile(filePath);
    } catch (err) {
      hasErrors = true;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Invalid JSON: presets/${name}\n${message}`);
    }
  }

  if (hasErrors) {
    process.exit(1);
  }
}

main();
