import { describe, it, expect, vi } from 'vitest';
import { validateAndScore } from '../validate.js';
import { llmJsonCall } from '../../llm/index.js';
import type { McpCandidate } from '../types.js';

vi.mock('../../llm/index.js');

function makeCandidate(overrides: Partial<McpCandidate> = {}): McpCandidate {
  return {
    name: 'test-mcp',
    repoFullName: 'org/test-mcp',
    url: 'https://github.com/org/test-mcp',
    description: 'Test MCP server',
    stars: 5000,
    lastPush: new Date().toISOString(),
    vendor: false,
    score: 0,
    reason: '',
    matchedDep: 'test',
    ...overrides,
  };
}

describe('validateAndScore', () => {
  it('filters community MCPs with low stars', async () => {
    const candidates = [
      makeCandidate({ name: 'low-stars', stars: 50 }),
      makeCandidate({ name: 'high-stars', stars: 5000 }),
    ];

    vi.mocked(llmJsonCall).mockResolvedValueOnce([
      { index: 0, score: 80, reason: 'Relevant' },
    ]);

    const result = await validateAndScore(candidates, ['test']);
    // low-stars should be filtered out by quality gate
    expect(result.every(r => r.name !== 'low-stars')).toBe(true);
  });

  it('vendor MCPs bypass quality gates', async () => {
    const candidates = [
      makeCandidate({ name: 'vendor-mcp', stars: 50, vendor: true }),
    ];

    vi.mocked(llmJsonCall).mockResolvedValueOnce([
      { index: 0, score: 90, reason: 'Official vendor' },
    ]);

    const result = await validateAndScore(candidates, ['test']);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('vendor-mcp');
  });

  it('returns fallback on LLM failure', async () => {
    const candidates = [
      makeCandidate({ name: 'fallback-mcp', description: 'A test server' }),
    ];

    vi.mocked(llmJsonCall).mockRejectedValueOnce(new Error('LLM error'));

    const result = await validateAndScore(candidates, ['test']);
    expect(result.length).toBe(1);
    expect(result[0].score).toBe(50);
  });

  it('returns empty array when no candidates pass quality gates', async () => {
    const candidates = [
      makeCandidate({ stars: 10, lastPush: '2020-01-01T00:00:00Z' }),
    ];

    const result = await validateAndScore(candidates, ['test']);
    expect(result).toEqual([]);
  });
});
