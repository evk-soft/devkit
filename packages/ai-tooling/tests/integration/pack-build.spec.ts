import { expect, it, vi } from 'vitest';
import type {
  ContainedPathRef,
  ReadOnlySourceContext,
  RepositoryReadBudget,
} from '../../src/model/types.js';
import { buildPack, type PackBuildDestination } from '../../src/pack/build.js';

const repositoryWriteSpy = vi.fn();
const networkSpy = vi.fn();

const SOURCE_FILES: Readonly<Record<string, string>> = {
  'configs/ai/pack.json': JSON.stringify({
    version: 1,
    name: '@evk-soft/ai-pack-core',
    packVersion: '0.1.0',
    rules: [{ id: 'evk-soft/rules/grounding', path: 'rules/evk-grounding' }],
    skills: [{ id: 'evk-soft/skills/plan', path: 'skills/evk-plan' }],
  }),
  'configs/ai/rules/evk-grounding/rule.json': JSON.stringify({
    version: 1,
    id: 'evk-soft/rules/grounding',
    title: 'Grounding',
    instructions: 'instructions.md',
  }),
  'configs/ai/rules/evk-grounding/instructions.md': '# Grounding\n\nGround every claim.\n',
  'configs/ai/skills/evk-plan/skill.json': JSON.stringify({
    version: 1,
    id: 'evk-soft/skills/plan',
    title: 'Plan',
    description: 'Plan before implementing.',
    instructions: 'instructions.md',
  }),
  'configs/ai/skills/evk-plan/instructions.md': '# Plan\n\nPlan first.\n',
};

function budget(): RepositoryReadBudget {
  return { claim: () => undefined, claimEntry: () => undefined };
}

function sourceContext(): ReadOnlySourceContext {
  return {
    readBudget: budget(),
    filesystem: {
      resolve(relativePath: string): ContainedPathRef {
        return { relativePath } as ContainedPathRef;
      },
      async readFile(ref: ContainedPathRef): Promise<Uint8Array> {
        const contents = SOURCE_FILES[ref.relativePath];
        if (contents === undefined) throw new Error(`absent fixture file: ${ref.relativePath}`);
        return new TextEncoder().encode(contents);
      },
      async listDirectory(ref: ContainedPathRef): Promise<readonly string[]> {
        const prefix = `${ref.relativePath}/`;
        return Object.keys(SOURCE_FILES)
          .filter((path) => path.startsWith(prefix))
          .map((path) => path.slice(prefix.length))
          .filter((rest) => !rest.includes('/'));
      },
      async isExecutable(): Promise<boolean> {
        return false;
      },
    },
  };
}

function sourceRoot(): ContainedPathRef {
  return { relativePath: 'configs/ai' } as ContainedPathRef;
}

function memoryDestination(): PackBuildDestination & { readonly files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>();
  return {
    root: '/memory',
    files,
    async createDirectoryExclusive(): Promise<void> {
      // Directories are implicit in the in-memory map.
    },
    async writeFileExclusive(path: string, bytes: Uint8Array): Promise<void> {
      if (files.has(path)) throw new Error(`destination path written twice: ${path}`);
      files.set(path, bytes);
    },
  };
}

it('builds two byte-identical trees without repository writes', async () => {
  const first = memoryDestination();
  const second = memoryDestination();
  const left = await buildPack(sourceContext(), sourceRoot(), first);
  const right = await buildPack(sourceContext(), sourceRoot(), second);
  expect([...first.files]).toStrictEqual([...second.files]);
  expect(left.files).toStrictEqual(right.files);
  expect(repositoryWriteSpy).not.toHaveBeenCalled();
  expect(networkSpy).not.toHaveBeenCalled();
});

it('copies instruction bytes unchanged and re-renders metadata', async () => {
  const destination = memoryDestination();
  await buildPack(sourceContext(), sourceRoot(), destination);
  const instructions = destination.files.get('rules/evk-grounding/instructions.md');
  expect(new TextDecoder().decode(instructions)).toBe(
    SOURCE_FILES['configs/ai/rules/evk-grounding/instructions.md'],
  );
  const metadata = new TextDecoder().decode(
    destination.files.get('rules/evk-grounding/rule.json') as Uint8Array,
  );
  expect(metadata.startsWith('{\n  "$schema": "https://raw.githubusercontent.com/')).toBe(true);
  expect(metadata.endsWith('\n')).toBe(true);
});

it('rejects an executable instruction file before any destination write', async () => {
  const context = sourceContext();
  const executableContext: ReadOnlySourceContext = {
    ...context,
    filesystem: {
      ...context.filesystem,
      async isExecutable(): Promise<boolean> {
        return true;
      },
    },
  };
  const destination = memoryDestination();
  await expect(buildPack(executableContext, sourceRoot(), destination)).rejects.toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ reason: 'executable-asset' }),
    }),
  );
  expect(destination.files.size).toBe(0);
});
