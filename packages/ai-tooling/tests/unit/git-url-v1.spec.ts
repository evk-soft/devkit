import { expect, it } from 'vitest';

import { normalizeGitUrlV1 } from '../../src/config/git-url-v1.js';

const INVALID_GIT_URLS = [
  'http://example.com/a',
  'https://user@example.com/a',
  'https://example.com/a?x=1',
  'https://example.com/a#x',
  'https://éxample.com/a',
  'https://%65xample.com/a',
  'https://[::1]/a',
  'https://127.0.0.1/a',
  'https://example.com:0443/a',
  'https://example.com/a\\b',
  ' https://example.com/a',
] as const;

it('rejects Unicode host without runtime URL parsing', () => {
  expect(() => normalizeGitUrlV1('https://éxample.com/repo.git')).toThrowError(/non-ASCII host/u);
});

it.each(INVALID_GIT_URLS)('rejects invalid Git URL %s', (value) => {
  expect(() => normalizeGitUrlV1(value)).toThrowError();
});

it.each([
  ['HTTPS://EXAMPLE.COM:443/a/./b/../repo.git', 'https://example.com/a/repo.git'],
  ['https://example.com/%7erepo.git', 'https://example.com/~repo.git'],
  ['https://example.com/%2frepo.git', 'https://example.com/%2Frepo.git'],
] as const)('normalizes %s', (input, output) => {
  expect(normalizeGitUrlV1(input)).toBe(output);
});

it('keeps a non-default port and drops only 443', () => {
  expect(normalizeGitUrlV1('https://example.com:8443/repo.git')).toBe(
    'https://example.com:8443/repo.git',
  );
  expect(normalizeGitUrlV1('https://example.com:443/repo.git')).toBe(
    'https://example.com/repo.git',
  );
});

it('is idempotent', () => {
  const once = normalizeGitUrlV1('HTTPS://EXAMPLE.COM:443/a/./b/../repo.git');
  expect(normalizeGitUrlV1(once)).toBe(once);
});
