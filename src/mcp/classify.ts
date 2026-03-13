import { llmJsonCall } from '../llm/index.js';
import { CLASSIFY_DEPS_PROMPT } from './prompts.js';

/**
 * Use LLM to classify dependencies as "tools" (MCP-worthy services/platforms)
 * vs "libraries" (utility packages). Returns only tool dependency names.
 */
export async function classifyDeps(allDeps: string[]): Promise<string[]> {
  if (allDeps.length === 0) return [];

  try {
    const result = await llmJsonCall<string[]>({
      system: CLASSIFY_DEPS_PROMPT,
      prompt: `Dependencies:\n${JSON.stringify(allDeps)}`,
      maxTokens: 2000,
    });

    if (!Array.isArray(result)) return [];

    // Only keep results that are actually in the input list (case-insensitive)
    const inputLower = new Set(allDeps.map(d => d.toLowerCase()));
    return result.filter(d => typeof d === 'string' && inputLower.has(d.toLowerCase()));
  } catch {
    // Fallback: use a simple heuristic blocklist
    return fallbackClassify(allDeps);
  }
}

/**
 * Fallback classification when LLM is unavailable.
 * Filters out known utility/framework packages.
 */
function fallbackClassify(deps: string[]): string[] {
  const utilityPatterns = [
    /^@types\//,
    /^eslint/,
    /^prettier/,
    /^@typescript-eslint\//,
    /^@commitlint\//,
    /^@eslint\//,
    /^webpack/,
    /^rollup/,
    /^babel/,
    /^@babel\//,
    /^postcss/,
    /^tailwindcss/,
    /^autoprefixer/,
  ];

  const utilities = new Set([
    'typescript', 'tslib', 'ts-node', 'tsx',
    'prettier', 'eslint',
    'rimraf', 'cross-env', 'dotenv', 'nodemon',
    'husky', 'lint-staged', 'commitlint',
    'chalk', 'ora', 'commander', 'yargs', 'meow',
    'inquirer', 'glob', 'minimatch', 'micromatch',
    'diff', 'semver', 'uuid', 'nanoid',
    'debug', 'ms', 'lodash', 'underscore', 'ramda',
    'tsup', 'esbuild', 'rollup', 'webpack', 'vite', 'parcel',
    'vitest', 'jest', 'mocha', 'chai', 'ava', 'tap',
    'fs-extra', 'mkdirp', 'del',
    'path-to-regexp', 'strip-ansi', 'ansi-colors',
    'react', 'react-dom', 'next', 'vue', 'angular', 'svelte',
    'express', 'fastify', 'koa', 'hapi',
    'zod', 'joi', 'yup', 'ajv',
    'axios', 'node-fetch', 'got', 'undici',
    'moment', 'dayjs', 'date-fns', 'luxon',
  ]);

  return deps.filter(d => {
    const lower = d.toLowerCase();
    if (utilities.has(lower)) return false;
    if (utilityPatterns.some(p => p.test(lower))) return false;
    return true;
  });
}
