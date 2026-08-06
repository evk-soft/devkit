import { toolingError } from './error.js';

/**
 * Terminal-safe output encoders.
 *
 * Untrusted bytes routinely end up inside diagnostics. If they reached a terminal unchanged, an
 * escape sequence could repaint the screen, erase lines, or reorder text so the operator reads
 * something that never happened. Both encoders below are injective: distinct logical inputs always
 * produce distinct output, so escaping never destroys information.
 */

export interface TerminalSink {
  write(bytes: Uint8Array): Promise<void> | void;
  flush(): Promise<void> | void;
}

export interface TerminalSafeLimits {
  readonly maxOutputBytes?: number;
}

const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024;

/** Separator and bidirectional-control scalars that must never reach a terminal unescaped. */
const ESCAPED_SCALARS = new Set<number>([
  0x2028, 0x2029, 0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067,
  0x2068, 0x2069,
]);

function isC0OrC1(codePoint: number): boolean {
  return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
}

function upperHex(value: number, width: number): string {
  return value.toString(16).toUpperCase().padStart(width, '0');
}

/**
 * Human mode: every hazardous scalar becomes readable text.
 *
 * A literal backslash is doubled first, so `\x1B` typed by a user and a real escape byte cannot
 * collapse into the same output.
 */
export function encodeHumanScalar(codePoint: number): string {
  if (codePoint === 0x5c) return '\\\\';
  if (codePoint === 0x22) return '\\"';
  if (isC0OrC1(codePoint)) return `\\x${upperHex(codePoint, 2)}`;
  if (ESCAPED_SCALARS.has(codePoint)) return `\\u{${upperHex(codePoint, 4)}}`;
  return String.fromCodePoint(codePoint);
}

/** JSON mode: the logical scalar is preserved, but never emitted raw. */
export function encodeJsonScalar(codePoint: number): string {
  if (codePoint === 0x5c) return '\\\\';
  if (codePoint === 0x22) return '\\"';
  if (isC0OrC1(codePoint) || ESCAPED_SCALARS.has(codePoint)) {
    return `\\u${upperHex(codePoint, 4)}`;
  }
  return String.fromCodePoint(codePoint);
}

function encodingInvalid(reason: 'malformed-utf8' | 'non-scalar-value'): never {
  throw toolingError('EVK_SECURITY_OUTPUT_ENCODING_INVALID', 'output encoding is invalid', {
    reason,
  });
}

function limitExceeded(limit: number): never {
  throw toolingError('EVK_SECURITY_RESOURCE_LIMIT', 'encoded output exceeds its limit', {
    reason: 'output-bytes',
    fields: { limit },
  });
}

async function streamEncoded(
  chunks: AsyncIterable<Uint8Array>,
  sink: TerminalSink,
  limits: TerminalSafeLimits,
  encodeScalar: (codePoint: number) => string,
  prefix: string,
  suffix: string,
): Promise<void> {
  const maxOutputBytes = limits.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const encoder = new TextEncoder();
  let produced = 0;

  // Counted before every write, so a one-over result is rejected without the sink ever seeing it.
  const emit = async (text: string): Promise<void> => {
    if (text === '') return;
    const bytes = encoder.encode(text);
    if (produced + bytes.byteLength > maxOutputBytes) limitExceeded(maxOutputBytes);
    produced += bytes.byteLength;
    await sink.write(bytes);
  };

  const encodeText = (text: string): string => {
    let out = '';
    for (const character of text) {
      out += encodeScalar(character.codePointAt(0) ?? 0);
    }
    return out;
  };

  const pending: string[] = [prefix];
  try {
    for await (const chunk of chunks) {
      // `stream: true` keeps a partial sequence buffered across chunk boundaries instead of
      // decoding it as a replacement character.
      pending.push(encodeText(decoder.decode(chunk, { stream: true })));
    }
    // A final decode with no input flushes the buffer; an incomplete tail throws here.
    pending.push(encodeText(decoder.decode()));
  } catch (error) {
    if (error instanceof TypeError) encodingInvalid('malformed-utf8');
    throw error;
  }
  pending.push(suffix);

  for (const text of pending) {
    await emit(text);
  }
  await sink.flush();
}

export function streamHumanTerminalSafeUtf8(
  chunks: AsyncIterable<Uint8Array>,
  sink: TerminalSink,
  limits: TerminalSafeLimits = {},
): Promise<void> {
  return streamEncoded(chunks, sink, limits, encodeHumanScalar, '', '');
}

export function streamJsonTerminalSafeString(
  chunks: AsyncIterable<Uint8Array>,
  sink: TerminalSink,
  limits: TerminalSafeLimits = {},
): Promise<void> {
  return streamEncoded(chunks, sink, limits, encodeJsonScalar, '"', '"');
}
