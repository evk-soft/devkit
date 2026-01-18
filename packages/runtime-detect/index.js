export function detectRuntime() {
  // Bun: https://bun.com/docs/guides/util/detect-bun
  if (typeof process !== 'undefined' && process?.versions?.bun) {
    return { name: 'bun', version: process.versions.bun };
  }

  // Node.js
  if (typeof process !== 'undefined' && process?.version) {
    return { name: 'node', version: process.version };
  }

  return { name: 'unknown', version: '0.0.0' };
}

export function isBun() {
  return detectRuntime().name === 'bun';
}

export function isNode() {
  return detectRuntime().name === 'node';
}
