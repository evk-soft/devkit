export type Runtime =
  | { name: 'bun'; version: string }
  | { name: 'node'; version: string }
  | { name: 'unknown'; version: string };

export function detectRuntime(): Runtime;
export function isBun(): boolean;
export function isNode(): boolean;
