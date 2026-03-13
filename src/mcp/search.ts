import type { McpCandidate } from './types.js';

const AWESOME_MCP_URL = 'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md';
const GITHUB_SEARCH_URL = 'https://github.com/search';

const SEARCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html',
};

interface GitHubRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  owner_login: string;
}

/**
 * Parse GitHub web search HTML to extract repository results from embedded JSON.
 */
function parseGitHubSearchHtml(html: string): GitHubRepo[] {
  try {
    const scriptMatch = html.match(/<script type="application\/json" data-target="react-app\.embeddedData">([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      return [];
    }

    const data = JSON.parse(scriptMatch[1]);
    const results = data?.payload?.results;
    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((r: Record<string, unknown>) => {
      const repo = (r as { repo?: { repository?: { name?: string; owner_login?: string; updated_at?: string } } }).repo?.repository;
      const ownerLogin = repo?.owner_login || '';
      const name = repo?.name || '';
      const description = typeof r.hl_trunc_description === 'string'
        ? r.hl_trunc_description.replace(/<\/?em>/g, '')
        : null;

      return {
        full_name: `${ownerLogin}/${name}`,
        description,
        stargazers_count: typeof r.followers === 'number' ? r.followers : 0,
        pushed_at: repo?.updated_at || '',
        owner_login: ownerLogin,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Search all MCP sources in parallel: awesome lists, GitHub search, vendor orgs.
 * Deduplicates by repo full_name.
 */
export async function searchAllMcpSources(toolDeps: string[]): Promise<McpCandidate[]> {
  if (toolDeps.length === 0) return [];

  const searches: Promise<McpCandidate[]>[] = [
    searchAwesomeMcpLists(toolDeps),
    ...toolDeps.map(dep => searchGitHub(dep)),
    ...toolDeps.map(dep => searchVendorOrg(dep)),
  ];

  const results = await Promise.all(searches);

  // Deduplicate by repoFullName
  const seen = new Map<string, McpCandidate>();
  for (const batch of results) {
    for (const candidate of batch) {
      const key = candidate.repoFullName.toLowerCase();
      const existing = seen.get(key);
      // Keep the one with more stars, or prefer vendor
      if (!existing || candidate.vendor || candidate.stars > existing.stars) {
        seen.set(key, candidate);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Fetch the awesome-mcp-servers curated list and filter for matching deps.
 */
async function searchAwesomeMcpLists(toolDeps: string[]): Promise<McpCandidate[]> {
  try {
    const resp = await fetch(AWESOME_MCP_URL, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) return [];
    const markdown = await resp.text();

    const candidates: McpCandidate[] = [];
    const depLower = toolDeps.map(d => d.toLowerCase().replace(/^@[^/]+\//, ''));

    // Parse markdown links: - [Name](url) - description
    const itemPattern = /^[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*[-–—:]\s*(.*)/gm;
    let match: RegExpExecArray | null;

    while ((match = itemPattern.exec(markdown)) !== null) {
      const [, name, url, description] = match;
      if (!url.includes('github.com')) continue;

      const text = `${name} ${description}`.toLowerCase();
      const matchedDep = depLower.find(d => text.includes(d));
      if (!matchedDep) continue;

      // Extract repo full_name from GitHub URL
      const repoMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
      if (!repoMatch) continue;

      candidates.push({
        name: name.trim(),
        repoFullName: repoMatch[1],
        url: url.trim(),
        description: description.trim().slice(0, 200),
        stars: 0,
        lastPush: '',
        vendor: false,
        score: 0,
        reason: '',
        matchedDep: toolDeps.find(d => d.toLowerCase().replace(/^@[^/]+\//, '') === matchedDep) || matchedDep,
      });
    }

    return candidates;
  } catch {
    return [];
  }
}

/**
 * Search GitHub for MCP servers matching a specific dependency.
 */
async function searchGitHub(dep: string): Promise<McpCandidate[]> {
  const depName = dep.replace(/^@[^/]+\//, '');
  try {
    const query = encodeURIComponent(`${depName} mcp server`);
    const url = `${GITHUB_SEARCH_URL}?q=${query}&type=repositories&s=stars&o=desc`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: SEARCH_HEADERS,
    });
    if (!resp.ok) return [];

    const html = await resp.text();
    const repos = parseGitHubSearchHtml(html).slice(0, 5);

    return repos.map(repo => ({
      name: repo.full_name.split('/')[1],
      repoFullName: repo.full_name,
      url: `https://github.com/${repo.full_name}`,
      description: repo.description || '',
      stars: repo.stargazers_count,
      lastPush: repo.pushed_at,
      vendor: false,
      score: 0,
      reason: '',
      matchedDep: dep,
    }));
  } catch {
    return [];
  }
}

/**
 * Check if the dependency's vendor org has an official MCP server.
 */
async function searchVendorOrg(dep: string): Promise<McpCandidate[]> {
  // Map dep name to likely GitHub org
  const depName = dep.replace(/^@([^/]+)\/.*/, '$1').replace(/^@/, '');
  const orgName = depName.toLowerCase();

  try {
    const query = encodeURIComponent(`mcp org:${orgName}`);
    const url = `${GITHUB_SEARCH_URL}?q=${query}&type=repositories&s=stars&o=desc`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: SEARCH_HEADERS,
    });
    if (!resp.ok) return [];

    const html = await resp.text();
    const repos = parseGitHubSearchHtml(html).slice(0, 5);

    return repos.map(repo => ({
      name: repo.full_name.split('/')[1],
      repoFullName: repo.full_name,
      url: `https://github.com/${repo.full_name}`,
      description: repo.description || '',
      stars: repo.stargazers_count,
      lastPush: repo.pushed_at,
      vendor: repo.owner_login.toLowerCase() === orgName,
      score: 0,
      reason: '',
      matchedDep: dep,
    }));
  } catch {
    return [];
  }
}
