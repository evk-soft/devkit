import { expect, it } from 'vitest';

import { createTempRepository } from '../helpers/temp-repository.js';

it('ignores local state but not the repository lock', async () => {
  const repo = await createTempRepository({ copy: ['.gitignore'] });
  try {
    for (const path of [
      '.ai-tooling/state.json',
      '.ai-tooling/backups/probe',
      '.ai-tooling/run.lock',
      '.ai-tooling/reports/probe.json',
    ]) {
      const result = await repo.git('check-ignore', '-v', '--no-index', path);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\.gitignore:.*:\/\.ai-tooling\//u);
    }
    expect(
      await repo.git('check-ignore', '-v', '--no-index', 'ai-tooling.lock.json'),
    ).toStrictEqual({
      exitCode: 1,
      stdout: '',
      stderr: '',
    });
  } finally {
    await repo.dispose();
  }
});
