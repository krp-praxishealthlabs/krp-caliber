import { describe, it, expect, vi } from 'vitest';
import { classifyDeps } from '../classify.js';
import { llmJsonCall } from '../../llm/index.js';

vi.mock('../../llm/index.js');

describe('classifyDeps', () => {
  it('returns tool deps from LLM response', async () => {
    vi.mocked(llmJsonCall).mockResolvedValueOnce(['supabase', 'stripe', 'sentry']);

    const result = await classifyDeps(['supabase', 'stripe', 'sentry', 'lodash', 'react', 'chalk']);
    expect(result).toEqual(['supabase', 'stripe', 'sentry']);
  });

  it('returns empty array when no deps provided', async () => {
    const result = await classifyDeps([]);
    expect(result).toEqual([]);
  });

  it('filters out LLM responses not in input list', async () => {
    vi.mocked(llmJsonCall).mockResolvedValueOnce(['supabase', 'nonexistent']);

    const result = await classifyDeps(['supabase', 'lodash']);
    expect(result).toEqual(['supabase']);
  });

  it('falls back to heuristic on LLM failure', async () => {
    vi.mocked(llmJsonCall).mockRejectedValueOnce(new Error('API error'));

    const result = await classifyDeps(['supabase', 'lodash', 'react', 'stripe']);
    // Heuristic should filter out lodash and react
    expect(result).toContain('supabase');
    expect(result).toContain('stripe');
    expect(result).not.toContain('lodash');
    expect(result).not.toContain('react');
  });
});
