import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchAllMcpSources } from '../search.js';

function makeFakeSearchHtml(results: Array<{
  name: string;
  owner_login: string;
  description?: string;
  stars?: number;
  updated_at?: string;
}>): string {
  const payload = {
    payload: {
      results: results.map(r => ({
        hl_name: `${r.owner_login}/${r.name}`,
        hl_trunc_description: r.description || '',
        followers: r.stars ?? 0,
        repo: {
          repository: {
            name: r.name,
            owner_login: r.owner_login,
            updated_at: r.updated_at || new Date().toISOString(),
          },
        },
      })),
    },
  };
  return `<html><script type="application/json" data-target="react-app.embeddedData">${JSON.stringify(payload)}</script></html>`;
}

describe('searchAllMcpSources', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns empty array when no deps provided', async () => {
    const result = await searchAllMcpSources([]);
    expect(result).toEqual([]);
  });

  it('deduplicates results by repoFullName', async () => {
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();

      if (urlStr.includes('awesome-mcp-servers')) {
        return new Response('- [supabase-mcp](https://github.com/supabase/mcp-server) — Official Supabase MCP\n', { status: 200 });
      }
      if (urlStr.includes('github.com/search')) {
        return new Response(makeFakeSearchHtml([{
          name: 'mcp-server',
          owner_login: 'supabase',
          description: 'Supabase MCP server',
          stars: 5000,
        }]), { status: 200 });
      }
      return new Response('', { status: 404 });
    });

    const result = await searchAllMcpSources(['supabase']);
    // Should be deduplicated to one entry
    const supabaseEntries = result.filter(r => r.repoFullName === 'supabase/mcp-server');
    expect(supabaseEntries.length).toBe(1);
  });

  it('handles network errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const result = await searchAllMcpSources(['stripe']);
    expect(result).toEqual([]);
  });
});
