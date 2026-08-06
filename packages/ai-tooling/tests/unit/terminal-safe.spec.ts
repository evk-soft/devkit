import { expect, it } from 'vitest';

import {
  streamHumanTerminalSafeUtf8,
  streamJsonTerminalSafeString,
} from '../../src/diagnostics/terminal-safe.js';

// Hazardous scalars are built from code points rather than written literally, so this committed
// source stays plain ASCII and never carries a raw terminal control itself.
const ESC = String.fromCharCode(0x1b);
const BEL = String.fromCharCode(0x07);
const NUL = String.fromCharCode(0x00);
const DEL = String.fromCharCode(0x7f);
const C1 = String.fromCharCode(0x9b);
const RLO = String.fromCharCode(0x202e);
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const BACKSLASH = String.fromCharCode(0x5c);

const HAZARDOUS_RANGES: readonly (readonly [number, number])[] = [
  [0x0000, 0x001f],
  [0x007f, 0x009f],
  [0x061c, 0x061c],
  [0x200e, 0x200f],
  [0x202a, 0x202e],
  [0x2028, 0x2029],
  [0x2066, 0x2069],
];

function containsHazardousScalar(text: string): boolean {
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (HAZARDOUS_RANGES.some(([low, high]) => codePoint >= low && codePoint <= high)) return true;
  }
  return false;
}

function collectingSink() {
  const written: Uint8Array[] = [];
  let flushed = 0;
  return {
    written,
    get flushed() {
      return flushed;
    },
    async write(bytes: Uint8Array): Promise<void> {
      written.push(bytes.slice());
    },
    async flush(): Promise<void> {
      flushed += 1;
    },
    text(): string {
      return Buffer.concat(written).toString('utf8');
    },
  };
}

async function* singleChunk(logical: string): AsyncIterable<Uint8Array> {
  yield new TextEncoder().encode(logical);
}

async function encodeHuman(logical: string): Promise<string> {
  const sink = collectingSink();
  await streamHumanTerminalSafeUtf8(singleChunk(logical), sink);
  return sink.text();
}

async function encodeJsonString(logical: string): Promise<string> {
  const sink = collectingSink();
  await streamJsonTerminalSafeString(singleChunk(logical), sink);
  return sink.text();
}

it('never emits a raw terminal control', async () => {
  const logical = `ESC:${ESC}]52;c;payload${BEL} bidi:${RLO} literal:${BACKSLASH}x1B`;
  const human = await encodeHuman(logical);
  const json = await encodeJsonString(logical);
  expect(containsHazardousScalar(human)).toBe(false);
  expect(human).toContain(`${BACKSLASH}x1B]52;c;payload${BACKSLASH}x07`);
  expect(human).toContain(`${BACKSLASH}u{202E}`);
  expect(JSON.parse(json)).toBe(logical);
  expect(json).not.toContain(RLO);
});

it('escapes a literal backslash injectively in human mode', async () => {
  const encoded = await encodeHuman(`a${BACKSLASH}x1Bb`);
  expect(encoded).toBe(`a${BACKSLASH}${BACKSLASH}x1Bb`);
});

it('round-trips every logical string through JSON mode', async () => {
  for (const logical of [
    '',
    'plain',
    `quote:" backslash:${BACKSLASH}`,
    `newline:\n tab:\t nul:${NUL}`,
    `c1:${C1} del:${DEL}`,
    `separators:${LS}${PS}`,
    `bidi:${RLO}`,
    'astral:\u{1f600}',
  ]) {
    const json = await encodeJsonString(logical);
    expect(JSON.parse(json)).toBe(logical);
    expect(containsHazardousScalar(json)).toBe(false);
  }
});

it('flushes the sink exactly once after the final write', async () => {
  const sink = collectingSink();
  await streamHumanTerminalSafeUtf8(singleChunk('abc'), sink);
  expect(sink.flushed).toBe(1);
});

it('rejects malformed UTF-8 before writing anything', async () => {
  const sink = collectingSink();
  async function* bad(): AsyncIterable<Uint8Array> {
    yield Uint8Array.from([0xff, 0xfe]);
  }
  await expect(streamHumanTerminalSafeUtf8(bad(), sink)).rejects.toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({
        code: 'EVK_SECURITY_OUTPUT_ENCODING_INVALID',
        reason: 'malformed-utf8',
      }),
    }),
  );
  expect(sink.written).toHaveLength(0);
});

it('rejects UTF-8 truncated across the final chunk boundary', async () => {
  const sink = collectingSink();
  async function* split(): AsyncIterable<Uint8Array> {
    // First two bytes of a three-byte sequence; the third never arrives.
    yield Uint8Array.from([0xe2, 0x80]);
  }
  await expect(streamHumanTerminalSafeUtf8(split(), sink)).rejects.toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ reason: 'malformed-utf8' }),
    }),
  );
});

it('rejects output one byte over the limit before writing it', async () => {
  const sink = collectingSink();
  await expect(
    streamHumanTerminalSafeUtf8(singleChunk('abcdef'), sink, { maxOutputBytes: 5 }),
  ).rejects.toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ code: 'EVK_SECURITY_RESOURCE_LIMIT' }),
    }),
  );
});
