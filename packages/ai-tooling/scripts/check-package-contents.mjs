/**
 * Proves that the publishable tarball comes only from a fresh, isolated build.
 *
 * The working `dist/` is never packed: TypeScript is compiled into a private staging root, only the
 * declared publish inputs are copied there, and `pnpm pack` runs inside that root under a frozen
 * environment. The resulting archive is then parsed by the bounded gzip/tar reader below rather than
 * by any external extractor, so malformed or hostile archives fail closed instead of being trusted.
 */

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { argv, execPath, exit, platform, stderr, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { crc32, inflateRawSync } from 'node:zlib';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPOSITORY_ROOT = resolve(PACKAGE_ROOT, '..', '..');

const LIMITS = Object.freeze({
  maxCompressedBytes: 64 * 1024 * 1024,
  maxInflatedBytes: 256 * 1024 * 1024,
  maxEntries: 100_000,
  maxRegularFileBytes: 16 * 1024 * 1024,
  maxPathBytes: 4 * 1024,
  maxAggregatePathBytes: 16 * 1024 * 1024,
  maxGzipOptionalHeaderBytes: 4 * 1024,
  maxPaxRecordsPerFile: 100_000,
  maxPaxRecordBytes: 16 * 1024,
  maxAggregatePaxBytes: 16 * 1024 * 1024,
  packTimeoutMs: 300_000,
  maxStdoutBytes: 64 * 1024 * 1024,
  maxStderrBytes: 64 * 1024,
});

function fail(message) {
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// gzip
// ---------------------------------------------------------------------------

export function inflateSingleGzipMember(bytes) {
  if (bytes.byteLength > LIMITS.maxCompressedBytes)
    fail('gzip member exceeds the compressed limit');
  if (bytes.byteLength < 18) fail('gzip member is truncated');
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) fail('gzip magic is invalid');
  if (bytes[2] !== 0x08) fail('gzip compression method is not deflate');

  const flags = bytes[3];
  if ((flags & 0xe0) !== 0) fail('gzip reserved flag bits are set');

  let offset = 10;
  const headerStart = offset;
  const claimOptional = () => {
    if (offset - headerStart > LIMITS.maxGzipOptionalHeaderBytes) {
      fail('gzip optional header exceeds the limit');
    }
  };

  if ((flags & 0x04) !== 0) {
    if (offset + 2 > bytes.byteLength) fail('gzip extra field is truncated');
    const extraLength = bytes[offset] | (bytes[offset + 1] << 8);
    offset += 2 + extraLength;
    claimOptional();
  }
  for (const flag of [0x08, 0x10]) {
    if ((flags & flag) !== 0) {
      const terminator = bytes.indexOf(0, offset);
      if (terminator === -1) fail('gzip optional string is unterminated');
      offset = terminator + 1;
      claimOptional();
    }
  }
  if ((flags & 0x02) !== 0) {
    offset += 2;
    claimOptional();
  }
  if (offset > bytes.byteLength - 8) fail('gzip header overruns the member');

  const body = bytes.subarray(offset, bytes.byteLength - 8);
  const inflated = inflateRawSync(body, { maxOutputLength: LIMITS.maxInflatedBytes });

  const trailer = bytes.subarray(bytes.byteLength - 8);
  const expectedCrc = trailer.readUInt32LE(0);
  const expectedSize = trailer.readUInt32LE(4);
  if (crc32(inflated) !== expectedCrc) fail('gzip data CRC mismatch');
  if (inflated.byteLength >>> 0 !== expectedSize) fail('gzip ISIZE mismatch');
  return inflated;
}

// ---------------------------------------------------------------------------
// tar
// ---------------------------------------------------------------------------

const BLOCK = 512;
const ACCEPTED_TYPES = new Set(['0', '\0', '5']);

function parseNumericField(block, offset, length, label) {
  const field = block.subarray(offset, offset + length);
  if ((field[0] & 0x80) !== 0) fail(`${label} uses base-256 encoding, which is not accepted`);
  let text = '';
  for (const byte of field) {
    if (byte === 0 || byte === 0x20) break;
    text += String.fromCharCode(byte);
  }
  if (text === '') return 0;
  if (!/^[0-7]+$/u.test(text)) fail(`${label} is not valid octal`);
  return Number.parseInt(text, 8);
}

function readString(block, offset, length) {
  const field = block.subarray(offset, offset + length);
  const terminator = field.indexOf(0);
  return field.subarray(0, terminator === -1 ? field.length : terminator).toString('utf8');
}

function verifyChecksum(block) {
  const stored = parseNumericField(block, 148, 8, 'header checksum');
  let unsigned = 0;
  for (let index = 0; index < BLOCK; index += 1) {
    unsigned += index >= 148 && index < 156 ? 0x20 : block[index];
  }
  if (unsigned !== stored) fail('tar header checksum mismatch');
}

function parsePaxRecords(payload) {
  const records = new Map();
  let offset = 0;
  let recordCount = 0;
  let aggregate = 0;
  while (offset < payload.byteLength) {
    const space = payload.indexOf(0x20, offset);
    if (space === -1) fail('PAX record has no length separator');
    const declared = Number.parseInt(payload.subarray(offset, space).toString('ascii'), 10);
    if (!Number.isInteger(declared) || declared <= 0) fail('PAX record length is invalid');
    if (declared > LIMITS.maxPaxRecordBytes) fail('PAX record exceeds the size limit');
    aggregate += declared;
    if (aggregate > LIMITS.maxAggregatePaxBytes) fail('PAX records exceed the aggregate limit');
    recordCount += 1;
    if (recordCount > LIMITS.maxPaxRecordsPerFile) fail('PAX record count exceeds the limit');
    const record = payload.subarray(offset, offset + declared);
    if (record[record.length - 1] !== 0x0a) fail('PAX record is not newline terminated');
    const text = record.subarray(space - offset + 1, record.length - 1).toString('utf8');
    const equals = text.indexOf('=');
    if (equals === -1) fail('PAX record has no key separator');
    const key = text.slice(0, equals);
    if (records.has(key)) fail('PAX record key is duplicated');
    records.set(key, text.slice(equals + 1));
    offset += declared;
  }
  return records;
}

function assertSafePath(path) {
  if (path === '') fail('tar entry path is empty');
  if (Buffer.byteLength(path, 'utf8') > LIMITS.maxPathBytes)
    fail('tar entry path exceeds the limit');
  if (path.startsWith('/') || /^[A-Za-z]:/u.test(path)) fail('tar entry path is absolute');
  if (path.includes('\\')) fail('tar entry path contains a backslash');
  for (const segment of path.split('/')) {
    if (segment === '..') fail('tar entry path escapes the archive root');
  }
}

export function parseTar(bytes) {
  if (bytes.byteLength % BLOCK !== 0) fail('tar stream is not block aligned');
  const entries = [];
  const seen = new Set();
  let aggregatePathBytes = 0;
  let pending = null;
  let offset = 0;

  while (offset < bytes.byteLength) {
    const block = bytes.subarray(offset, offset + BLOCK);
    if (block.every((byte) => byte === 0)) {
      const second = bytes.subarray(offset + BLOCK, offset + 2 * BLOCK);
      if (second.length !== BLOCK || !second.every((byte) => byte === 0)) {
        fail('tar end-of-archive marker is incomplete');
      }
      const trailing = bytes.subarray(offset + 2 * BLOCK);
      if (!trailing.every((byte) => byte === 0)) fail('tar has data after the end marker');
      return entries;
    }

    verifyChecksum(block);
    const type = String.fromCharCode(block[156]);
    const size = parseNumericField(block, 124, 12, 'entry size');
    const payloadBlocks = Math.ceil(size / BLOCK);
    const payload = bytes.subarray(offset + BLOCK, offset + BLOCK + size);
    const padding = bytes.subarray(offset + BLOCK + size, offset + BLOCK + payloadBlocks * BLOCK);
    if (!padding.every((byte) => byte === 0)) fail('tar entry padding is not zero filled');

    if (type === 'g') fail('tar global PAX header is not accepted');
    if (type === 'L' || type === 'K') fail('tar GNU long-name header is not accepted');
    if (type === '1' || type === '2') fail('tar link entry is not accepted');
    if (type === '3' || type === '4' || type === '6')
      fail('tar device or FIFO entry is not accepted');

    if (type === 'x') {
      if (pending !== null) fail('chained PAX override is not accepted');
      pending = parsePaxRecords(payload);
      offset += BLOCK + payloadBlocks * BLOCK;
      continue;
    }

    if (!ACCEPTED_TYPES.has(type)) fail(`tar entry type is not accepted: ${type}`);

    const prefix = readString(block, 345, 155);
    const name = readString(block, 0, 100);
    let path = prefix === '' ? name : `${prefix}/${name}`;
    let effectiveSize = size;
    if (pending !== null) {
      const overridePath = pending.get('path');
      if (overridePath !== undefined) path = overridePath;
      const overrideSize = pending.get('size');
      if (overrideSize !== undefined) {
        if (!/^[0-9]+$/u.test(overrideSize)) fail('PAX size override is not numeric');
        effectiveSize = Number.parseInt(overrideSize, 10);
      }
      pending = null;
    }

    assertSafePath(path);
    aggregatePathBytes += Buffer.byteLength(path, 'utf8');
    if (aggregatePathBytes > LIMITS.maxAggregatePathBytes) {
      fail('tar aggregate path bytes exceed the limit');
    }
    if (seen.has(path)) fail('tar entry path is duplicated');
    seen.add(path);

    if (type === '5') {
      if (effectiveSize !== 0) fail('tar directory entry has a nonzero size');
    } else if (effectiveSize > LIMITS.maxRegularFileBytes) {
      fail('tar regular file exceeds the size limit');
    }

    entries.push({ path, type: type === '5' ? 'directory' : 'file', size: effectiveSize });
    if (entries.length > LIMITS.maxEntries) fail('tar entry count exceeds the limit');
    offset += BLOCK + payloadBlocks * BLOCK;
  }

  fail('tar stream ended without an end-of-archive marker');
}

// ---------------------------------------------------------------------------
// isolated build and pack
// ---------------------------------------------------------------------------

function resolvePnpmEntry() {
  const rootManifest = JSON.parse(readFileSync(join(REPOSITORY_ROOT, 'package.json'), 'utf8'));
  const declared = rootManifest.packageManager;
  const match = /^pnpm@(\d+\.\d+\.\d+)$/u.exec(declared ?? '');
  if (match === null) fail('root packageManager must pin an exact pnpm version');
  const version = match[1];

  const candidates = [];
  if (process.env.COREPACK_HOME !== undefined) candidates.push(process.env.COREPACK_HOME);
  if (platform === 'win32' && process.env.LOCALAPPDATA !== undefined) {
    candidates.push(join(process.env.LOCALAPPDATA, 'node', 'corepack'));
  }
  candidates.push(join(homedir(), '.cache', 'node', 'corepack'));
  candidates.push(join(homedir(), 'Library', 'Caches', 'node', 'corepack'));

  for (const root of candidates) {
    const entry = join(root, 'v1', 'pnpm', version, 'bin', 'pnpm.cjs');
    if (existsSync(entry)) return entry;
  }
  fail(`no installed pnpm ${version} JavaScript entry was found`);
}

function resolveTypeScriptEntry() {
  const entry = join(REPOSITORY_ROOT, 'node_modules', 'typescript', 'lib', 'tsc.js');
  if (!existsSync(entry)) fail('no installed TypeScript compiler entry was found');
  return entry;
}

function buildStagingRoot() {
  const staging = mkdtempSync(join(tmpdir(), 'evk-pack-staging-'), { mode: 0o700 });
  const source = join(staging, 'source');
  const packed = join(staging, 'packed');
  const privateHome = join(staging, 'home');
  mkdirSync(source, { mode: 0o700 });
  mkdirSync(packed, { mode: 0o700 });
  mkdirSync(privateHome, { mode: 0o700 });
  writeFileSync(join(privateHome, 'npmrc'), '');
  return { staging, source, packed, privateHome };
}

function compileInto(source) {
  const result = spawnSync(
    execPath,
    [
      resolveTypeScriptEntry(),
      '--project',
      join(PACKAGE_ROOT, 'tsconfig.json'),
      '--outDir',
      join(source, 'dist'),
      '--tsBuildInfoFile',
      join(source, '.tsbuildinfo'),
      '--pretty',
      'false',
    ],
    { cwd: PACKAGE_ROOT, shell: false, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    fail(`isolated TypeScript build failed:\n${result.stdout ?? ''}${result.stderr ?? ''}`);
  }
}

function copyPublishInputs(source) {
  for (const name of ['package.json', 'README.md', 'LICENSE']) {
    cpSync(join(PACKAGE_ROOT, name), join(source, name));
  }
  const schemas = join(PACKAGE_ROOT, 'schemas');
  if (existsSync(schemas)) {
    cpSync(schemas, join(source, 'schemas'), { recursive: true });
  }
}

function runPack(source, packed, privateHome) {
  const environment = {
    npm_config_ignore_scripts: 'true',
    npm_config_ignore_pnpmfile: 'true',
    npm_config_userconfig: join(privateHome, 'npmrc'),
    npm_config_globalconfig: join(privateHome, 'npmrc'),
    npm_config_cache: join(privateHome, 'cache'),
    npm_config_store_dir: join(privateHome, 'store'),
    npm_config_update_notifier: 'false',
    COREPACK_ENABLE_AUTO_PIN: '0',
    COREPACK_ENABLE_NETWORK: '0',
    HOME: privateHome,
    USERPROFILE: privateHome,
    TMPDIR: privateHome,
    TEMP: privateHome,
    TMP: privateHome,
    LANG: 'C',
    LC_ALL: 'C',
  };

  const result = spawnSync(
    execPath,
    [
      resolvePnpmEntry(),
      // `pnpm pack` in 10.28.0 accepts only --dry-run, --json, --out, --pack-destination,
      // -r and --workspace-concurrency. Script and pnpmfile suppression is therefore carried by
      // npm_config_ignore_scripts / npm_config_ignore_pnpmfile in the frozen environment below.
      'pack',
      '--json',
      '--pack-destination',
      packed,
    ],
    {
      cwd: source,
      shell: false,
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: LIMITS.packTimeoutMs,
      maxBuffer: LIMITS.maxStdoutBytes,
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    const tail = (result.stderr ?? '').slice(-LIMITS.maxStderrBytes);
    fail(`pnpm pack failed with status ${result.status}:\n${tail}`);
  }
  const produced = readdirSync(packed).filter((name) => name.endsWith('.tgz'));
  if (produced.length !== 1) fail(`expected exactly one tarball, found ${produced.length}`);
  return join(packed, produced[0]);
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

function main() {
  const wantsJson = argv.includes('--json');
  const roots = buildStagingRoot();
  try {
    compileInto(roots.source);
    copyPublishInputs(roots.source);
    const tarball = runPack(roots.source, roots.packed, roots.privateHome);
    const entries = parseTar(inflateSingleGzipMember(readFileSync(tarball)));
    const paths = entries.map((entry) => entry.path).sort();

    for (const path of paths) {
      if (!path.startsWith('package/')) fail(`tar entry is outside the package root: ${path}`);
    }
    if (!paths.includes('package/package.json')) fail('tarball is missing package/package.json');
    if (!paths.includes('package/LICENSE')) fail('tarball is missing package/LICENSE');
    if (!paths.includes('package/README.md')) fail('tarball is missing package/README.md');

    if (wantsJson) {
      stdout.write(`${JSON.stringify({ entries: paths }, null, 2)}\n`);
    } else {
      for (const path of paths) stdout.write(`${path}\n`);
    }
    return 0;
  } finally {
    rmSync(roots.staging, { recursive: true, force: true, maxRetries: 5 });
  }
}

try {
  exit(main());
} catch (error) {
  stderr.write(`package contents check failed: ${error.message}\n`);
  exit(1);
}
