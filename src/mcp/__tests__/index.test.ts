import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock all dependencies before importing
vi.mock('../../llm/index.js');
vi.mock('../deps.js');
vi.mock('../classify.js');
vi.mock('../search.js');
vi.mock('../validate.js');
vi.mock('../config-extract.js');

import { discoverAndInstallMcps } from '../index.js';
import { extractAllDeps } from '../deps.js';
import { classifyDeps } from '../classify.js';
import { searchAllMcpSources } from '../search.js';
import { validateAndScore } from '../validate.js';
import { fetchReadme, extractMcpConfig } from '../config-extract.js';
import type { Fingerprint } from '../../fingerprint/index.js';

function makeFingerprint(overrides: Partial<Fingerprint> = {}): Fingerprint {
  return {
    languages: ['TypeScript'],
    frameworks: [],
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
    // Force non-interactive mode
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
  });

  it('returns zero installed when no deps found', async () => {
    vi.mocked(extractAllDeps).mockReturnValue([]);

    const result = await discoverAndInstallMcps('claude', makeFingerprint(), tmpDir);
    expect(result.installed).toBe(0);
    expect(result.names).toEqual([]);
  });

  it('returns zero installed when no tool deps classified', async () => {
    vi.mocked(extractAllDeps).mockReturnValue(['lodash', 'react']);
    vi.mocked(classifyDeps).mockResolvedValue([]);

    const result = await discoverAndInstallMcps('claude', makeFingerprint(), tmpDir);
    expect(result.installed).toBe(0);
  });

  it('returns zero installed when no candidates found', async () => {
    vi.mocked(extractAllDeps).mockReturnValue(['supabase']);
    vi.mocked(classifyDeps).mockResolvedValue(['supabase']);
    vi.mocked(searchAllMcpSources).mockResolvedValue([]);

    const result = await discoverAndInstallMcps('claude', makeFingerprint(), tmpDir);
    expect(result.installed).toBe(0);
  });

  it('returns zero installed when no candidates pass validation', async () => {
    vi.mocked(extractAllDeps).mockReturnValue(['supabase']);
    vi.mocked(classifyDeps).mockResolvedValue(['supabase']);
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
      matchedDep: 'supabase',
    }]);
    vi.mocked(validateAndScore).mockResolvedValue([]);

    const result = await discoverAndInstallMcps('claude', makeFingerprint(), tmpDir);
    expect(result.installed).toBe(0);
  });

  it('skips already-installed MCPs', async () => {
    vi.mocked(extractAllDeps).mockReturnValue(['supabase']);
    vi.mocked(classifyDeps).mockResolvedValue(['supabase']);

    const fingerprint = makeFingerprint({
      existingConfigs: {
        claudeMcpServers: { 'supabase-mcp': { command: 'npx' } },
      },
    } as Partial<Fingerprint>);

    const result = await discoverAndInstallMcps('claude', fingerprint, tmpDir);
    expect(result.installed).toBe(0);
  });
});
