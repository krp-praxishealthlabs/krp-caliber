import { llmJsonCall } from '../llm/index.js';
import { EXTRACT_CONFIG_PROMPT } from './prompts.js';
import type { McpConfigTemplate } from './types.js';

/**
 * Fetch the README for a GitHub repo.
 */
export async function fetchReadme(repoFullName: string): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://raw.githubusercontent.com/${repoFullName}/HEAD/README.md`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (resp.ok) return await resp.text();
  } catch { /* ignore */ }

  // Fallback: try main branch explicitly
  try {
    const resp = await fetch(
      `https://raw.githubusercontent.com/${repoFullName}/main/README.md`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (resp.ok) return await resp.text();
  } catch { /* ignore */ }

  return null;
}

/**
 * Use LLM to extract MCP server config (command, args, env vars) from README.
 */
export async function extractMcpConfig(
  readme: string,
  serverName: string,
): Promise<McpConfigTemplate | null> {
  try {
    // Truncate very long READMEs to avoid token limits
    const truncated = readme.length > 15_000 ? readme.slice(0, 15_000) : readme;

    const result = await llmJsonCall<McpConfigTemplate>({
      system: EXTRACT_CONFIG_PROMPT,
      prompt: `MCP Server: ${serverName}\n\nREADME:\n${truncated}`,
      maxTokens: 2000,
    });

    if (!result || !result.command) return null;

    return {
      command: result.command,
      args: Array.isArray(result.args) ? result.args : [],
      env: Array.isArray(result.env) ? result.env : [],
    };
  } catch {
    return null;
  }
}
