import { expect, it } from 'vitest';

import { renderGeneratedJson } from '../../src/json/render-json.js';

it('renders one final LF without formatter', () => {
  const bytes = renderGeneratedJson(
    { schemaVersion: 1, long: 'x'.repeat(120), nested: { b: true, a: null } },
    ['schemaVersion', 'long', 'nested', 'a', 'b'],
  );
  expect(new TextDecoder().decode(bytes)).toBe(
    `{\n  "schemaVersion": 1,\n  "long": "${'x'.repeat(120)}",\n  "nested": {\n    "a": null,\n    "b": true\n  }\n}\n`,
  );
});

it('rejects a key absent from the schema order', () => {
  expect(() => renderGeneratedJson({ known: 1, surprise: 2 }, ['known'])).toThrowError(
    /not in the schema key order/u,
  );
});

it('renders empty containers and arrays exactly', () => {
  expect(new TextDecoder().decode(renderGeneratedJson({ a: [], b: {} }, ['a', 'b']))).toBe(
    '{\n  "a": [],\n  "b": {}\n}\n',
  );
  expect(new TextDecoder().decode(renderGeneratedJson({ a: [1, 2] }, ['a']))).toBe(
    '{\n  "a": [\n    1,\n    2\n  ]\n}\n',
  );
});

it('preserves Unicode code points and escapes only what JSON requires', () => {
  const decomposed = `e${String.fromCharCode(0x0301)}`;
  const rendered = new TextDecoder().decode(
    renderGeneratedJson({ a: decomposed, b: `quote:" backslash:\\ tab:\t` }, ['a', 'b']),
  );
  expect(rendered).toContain(`"a": "${decomposed}"`);
  expect(rendered).toContain('"b": "quote:\\" backslash:\\\\ tab:\\t"');
});

it('emits no BOM and never folds by line width', () => {
  const bytes = renderGeneratedJson({ a: 'y'.repeat(500) }, ['a']);
  expect(bytes[0]).toBe(0x7b);
  expect(new TextDecoder().decode(bytes).split('\n')).toHaveLength(4);
});

it('renders a lock-shaped record deterministically', () => {
  const order = ['version', 'configurationDigest', 'packs', 'name', 'digest'];
  const first = renderGeneratedJson(
    {
      version: 1,
      configurationDigest: 'a'.repeat(64),
      packs: [{ name: '@x/y', digest: 'b'.repeat(64) }],
    },
    order,
  );
  const second = renderGeneratedJson(
    {
      packs: [{ digest: 'b'.repeat(64), name: '@x/y' }],
      configurationDigest: 'a'.repeat(64),
      version: 1,
    },
    order,
  );
  expect(first).toStrictEqual(second);
});
