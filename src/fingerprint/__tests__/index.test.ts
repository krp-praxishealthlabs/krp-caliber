import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { computeFingerprintHash, collectFingerprint, Fingerprint } from '../index.js';

vi.mock('fs');
vi.mock('../git.js', () => ({ getGitRemoteUrl: () => 'https://github.com/test/repo' }));
vi.mock('../file-tree.js', () => ({ getFileTree: () => ['src/index.ts', 'package.json'] }));
vi.mock('../existing-config.js', () => ({ readExistingConfigs: () => ({}) }));
vi.mock('../code-analysis.js', () => ({
  analyzeCode: () => ({ fileSummaries: [], configFiles: [], truncated: false }),
}));

describe('computeFingerprintHash', () => {
  const baseFingerprint: Fingerprint = {
    languages: ['TypeScript'],
    frameworks: ['Next.js'],
    tools: [],
    fileTree: ['src/index.ts'],
    existingConfigs: {},
  };

  it('produces deterministic SHA-256 hash', () => {
    const fp = { ...baseFingerprint, gitRemoteUrl: 'https://github.com/test/repo', packageName: 'my-app' };
    const hash1 = computeFingerprintHash(fp);
    const hash2 = computeFingerprintHash(fp);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('uses gitRemoteUrl and packageName as key', () => {
    const fp1 = { ...baseFingerprint, gitRemoteUrl: 'https://github.com/a/b', packageName: 'app-a' };
    const fp2 = { ...baseFingerprint, gitRemoteUrl: 'https://github.com/a/b', packageName: 'app-b' };
    expect(computeFingerprintHash(fp1)).not.toBe(computeFingerprintHash(fp2));
  });

  it('handles missing gitRemoteUrl and packageName', () => {
    const hash = computeFingerprintHash(baseFingerprint);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('same hash for fingerprints with same url and package but different languages', () => {
    const fp1 = { ...baseFingerprint, gitRemoteUrl: 'git@github.com:test/repo', packageName: 'app' };
    const fp2 = { ...fp1, languages: ['Python', 'Go'] };
    expect(computeFingerprintHash(fp1)).toBe(computeFingerprintHash(fp2));
  });
});

describe('collectFingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty languages, frameworks, and tools (LLM fills them later)', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const fp = collectFingerprint('/tmp/test-project');
    expect(fp.languages).toEqual([]);
    expect(fp.frameworks).toEqual([]);
    expect(fp.tools).toEqual([]);
  });

  it('reads packageName from package.json when present', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'my-app' }) as never);
    const fp = collectFingerprint('/tmp/test-project');
    expect(fp.packageName).toBe('my-app');
  });

  it('returns undefined packageName when no package.json', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const fp = collectFingerprint('/tmp/test-project');
    expect(fp.packageName).toBeUndefined();
  });

  it('returns undefined packageName when package.json is invalid', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('not json' as never);
    const fp = collectFingerprint('/tmp/test-project');
    expect(fp.packageName).toBeUndefined();
  });

  it('includes gitRemoteUrl, fileTree, existingConfigs, and codeAnalysis', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const fp = collectFingerprint('/tmp/test-project');
    expect(fp.gitRemoteUrl).toBe('https://github.com/test/repo');
    expect(fp.fileTree).toEqual(['src/index.ts', 'package.json']);
    expect(fp.existingConfigs).toEqual({});
    expect(fp.codeAnalysis).toEqual({ fileSummaries: [], configFiles: [], truncated: false });
  });
});
