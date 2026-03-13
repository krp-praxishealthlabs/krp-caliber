import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('../../llm/index.js');
vi.mock('../search.js');
vi.mock('../validate.js');
vi.mock('../config-extract.js');

import { discoverAndInstallMcps } from '../index.js';
import { searchAllMcpSources } from '../search.js';
import { validateAndScore } from '../validate.js';
import type { Fingerprint } from '../../fingerprint/index.js';

function makeFingerprint(overrides: Partial<Fingerprint> = {}): Fingerprint {
  return {
    languages: ['TypeScript'],
    frameworks: [],
    tools: [],
    fileTree: ['package.json', 'src/index.ts'],
    existingConfigs: {},
    ...overrides,
  } as Fingerprint;
}

describe('discoverAndInstallMcps', () => {
  let tmpDir: string;
  const originalIsTTY = process.stdin.isTTY;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caliber-mcp-'));
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
  });

  it('returns zero installed when no tools detected', async () => {
    const result = await discoverAndInstallMcps('claude', makeFingerprint(), tmpDir);
    expect(result.installed).toBe(0);
    expect(result.names).toEqual([]);
  });

  it('returns zero installed when no candidates found', async () => {
    vi.mocked(searchAllMcpSources).mockResolvedValue([]);

    const result = await discoverAndInstallMcps('claude', makeFingerprint({ tools: ['Supabase'] }), tmpDir);
    expect(result.installed).toBe(0);
  });

  it('returns zero installed when no candidates pass validation', async () => {
    vi.mocked(searchAllMcpSources).mockResolvedValue([{
      name: 'supabase-mcp',
      repoFullName: 'supabase/mcp',
      url: 'https://github.com/supabase/mcp',
      description: 'MCP server',
      stars: 100,
      lastPush: '2020-01-01',
      vendor: false,
      score: 0,
      reason: '',
      matchedDep: 'Supabase',
    }]);
    vi.mocked(validateAndScore).mockResolvedValue([]);

    const result = await discoverAndInstallMcps('claude', makeFingerprint({ tools: ['Supabase'] }), tmpDir);
    expect(result.installed).toBe(0);
  });

  it('skips already-installed MCPs', async () => {
    const fingerprint = makeFingerprint({
      tools: ['Supabase'],
      existingConfigs: {
        claudeMcpServers: { 'supabase-mcp': { command: 'npx' } },
      },
    } as Partial<Fingerprint>);

    const result = await discoverAndInstallMcps('claude', fingerprint, tmpDir);
    expect(result.installed).toBe(0);
  });
});
