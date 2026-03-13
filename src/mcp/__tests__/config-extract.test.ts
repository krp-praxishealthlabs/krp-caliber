import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchReadme, extractMcpConfig } from '../config-extract.js';
import { llmJsonCall } from '../../llm/index.js';

vi.mock('../../llm/index.js');

describe('fetchReadme', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches README from HEAD ref', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response('# MCP Server\nInstallation guide...', { status: 200 })
    );

    const result = await fetchReadme('supabase/mcp-server');
    expect(result).toContain('MCP Server');
  });

  it('falls back to main branch', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(
        new Response('# Main README', { status: 200 })
      );

    const result = await fetchReadme('org/repo');
    expect(result).toContain('Main README');
  });

  it('returns null on failure', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const result = await fetchReadme('org/repo');
    expect(result).toBeNull();
  });
});

describe('extractMcpConfig', () => {
  it('extracts config from README via LLM', async () => {
    vi.mocked(llmJsonCall).mockResolvedValueOnce({
      command: 'npx',
      args: ['-y', '@supabase/mcp-server'],
      env: [
        { key: 'SUPABASE_ACCESS_TOKEN', description: 'Your access token', required: true },
      ],
    });

    const result = await extractMcpConfig('# Install\nnpx -y @supabase/mcp-server', 'supabase-mcp');
    expect(result).not.toBeNull();
    expect(result!.command).toBe('npx');
    expect(result!.args).toContain('-y');
    expect(result!.env).toHaveLength(1);
  });

  it('returns null on LLM failure', async () => {
    vi.mocked(llmJsonCall).mockRejectedValueOnce(new Error('LLM error'));

    const result = await extractMcpConfig('readme content', 'test-mcp');
    expect(result).toBeNull();
  });

  it('returns null when no command extracted', async () => {
    vi.mocked(llmJsonCall).mockResolvedValueOnce({
      command: '',
      args: [],
      env: [],
    });

    const result = await extractMcpConfig('no config found', 'test-mcp');
    expect(result).toBeNull();
  });
});
