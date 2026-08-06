/**
 * Version-1 Git URL normalization.
 *
 * The grammar is lexed from ASCII bytes directly. The runtime `URL` parser, `URLSearchParams`,
 * IDNA/UTS-46, and Unicode normalization are all deliberately unused: their behaviour varies between
 * runtime versions, and this function feeds a digest that must stay identical everywhere and
 * forever. Nothing here trims input, resolves against a base, or repairs backslashes.
 */

const SCHEME = 'https://';
const DEFAULT_PORT = '443';

/** RFC 3986 unreserved: these and only these may be decoded from a percent triplet. */
function isUnreserved(byte: number): boolean {
  return (
    (byte >= 0x41 && byte <= 0x5a) ||
    (byte >= 0x61 && byte <= 0x7a) ||
    (byte >= 0x30 && byte <= 0x39) ||
    byte === 0x2d ||
    byte === 0x2e ||
    byte === 0x5f ||
    byte === 0x7e
  );
}

function fail(message: string): never {
  throw new Error(`invalid Git URL: ${message}`);
}

function foldAsciiLowercase(value: string): string {
  let out = '';
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    out += code >= 0x41 && code <= 0x5a ? String.fromCharCode(code + 0x20) : value[index];
  }
  return out;
}

function assertAsciiHostLabel(label: string): void {
  if (label === '') fail('empty host label');
  for (let index = 0; index < label.length; index += 1) {
    const code = label.charCodeAt(index);
    if (code > 0x7f) fail('non-ASCII host');
    const isLetter = (code >= 0x61 && code <= 0x7a) || (code >= 0x41 && code <= 0x5a);
    const isDigit = code >= 0x30 && code <= 0x39;
    if (!isLetter && !isDigit && code !== 0x2d) fail('host label has an invalid character');
  }
  if (label.startsWith('-') || label.endsWith('-')) fail('host label starts or ends with a hyphen');
}

function normalizePath(path: string): string {
  if (path.includes('\\')) fail('path contains a backslash');

  // Decode only unreserved triplets; every retained triplet is uppercased so one byte has one
  // spelling. Reserved bytes such as %2F stay encoded, because decoding them would change the path.
  let decoded = '';
  for (let index = 0; index < path.length; index += 1) {
    const character = path[index];
    if (character !== '%') {
      if (path.charCodeAt(index) > 0x7f) fail('path contains a non-ASCII byte');
      decoded += character;
      continue;
    }
    const triplet = path.slice(index + 1, index + 3);
    if (!/^[0-9A-Fa-f]{2}$/u.test(triplet)) fail('path has a malformed percent triplet');
    const byte = Number.parseInt(triplet, 16);
    decoded += isUnreserved(byte) ? String.fromCharCode(byte) : `%${triplet.toUpperCase()}`;
    index += 2;
  }

  // RFC 3986 dot-segment removal, done on the decoded form so `.` and `..` cannot hide in triplets.
  const segments: string[] = [];
  for (const segment of decoded.split('/')) {
    if (segment === '.') continue;
    if (segment === '..') {
      if (segments.length <= 1) fail('path escapes its root');
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

export function normalizeGitUrlV1(input: string): string {
  if (input === '') fail('empty input');
  if (input !== input.trim()) fail('input has surrounding whitespace');

  const folded = foldAsciiLowercase(input);
  if (!folded.startsWith(SCHEME)) fail('scheme must be https');

  const authorityAndPath = input.slice(SCHEME.length);
  const slash = authorityAndPath.indexOf('/');
  if (slash === -1) fail('missing path');

  const authority = authorityAndPath.slice(0, slash);
  const path = authorityAndPath.slice(slash);

  if (path.includes('?')) fail('query is not permitted');
  if (path.includes('#')) fail('fragment is not permitted');
  if (authority.includes('@')) fail('userinfo is not permitted');
  if (authority.includes('%')) fail('percent encoding is not permitted in the authority');
  if (authority.includes('[') || authority.includes(']'))
    fail('bracketed IP host is not permitted');

  let host = authority;
  let port = '';
  const colon = authority.lastIndexOf(':');
  if (colon !== -1) {
    host = authority.slice(0, colon);
    port = authority.slice(colon + 1);
    if (!/^[1-9][0-9]{0,4}$/u.test(port))
      fail('port must be canonical decimal without leading zero');
    const numeric = Number.parseInt(port, 10);
    if (numeric < 1 || numeric > 65535) fail('port is out of range');
  }

  if (host === '') fail('empty host');
  const labels = foldAsciiLowercase(host).split('.');
  for (const label of labels) assertAsciiHostLabel(label);
  if (labels.length < 2) fail('host must be a dotted DNS name');
  if (labels.every((label) => /^[0-9]+$/u.test(label))) fail('numeric-only host is not permitted');

  const normalizedHost = foldAsciiLowercase(host);
  const normalizedPort = port === '' || port === DEFAULT_PORT ? '' : `:${port}`;
  return `${SCHEME}${normalizedHost}${normalizedPort}${normalizePath(path)}`;
}
