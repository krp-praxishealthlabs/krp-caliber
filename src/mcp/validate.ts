import { llmJsonCall } from '../llm/index.js';
import { SCORE_MCP_PROMPT } from './prompts.js';
import type { McpCandidate } from './types.js';

interface ScoredCandidate {
  index: number;
  score: number;
  reason: string;
}

const MIN_STARS = 100;
const MAX_AGE_DAYS = 180;

/**
 * Filter candidates by quality gates, then LLM-score for relevance.
 * Returns top 5 candidates sorted by score.
 */
export async function validateAndScore(
  candidates: McpCandidate[],
  toolDeps: string[],
): Promise<McpCandidate[]> {
  // Apply quality gates (vendor MCPs bypass these checks)
  const qualityFiltered = candidates.filter(c => {
    if (c.vendor) return true;

    // Stars check
    if (c.stars > 0 && c.stars < MIN_STARS) return false;

    // Recency check
    if (c.lastPush) {
      const pushDate = new Date(c.lastPush);
      const daysAgo = (Date.now() - pushDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo > MAX_AGE_DAYS) return false;
    }

    return true;
  });

  if (qualityFiltered.length === 0) return [];

  // LLM scoring
  try {
    return await scoreWithLLM(qualityFiltered, toolDeps);
  } catch {
    // Fallback: return unsorted candidates
    return qualityFiltered.slice(0, 5).map(c => ({
      ...c,
      score: 50,
      reason: c.description.slice(0, 80),
    }));
  }
}

async function scoreWithLLM(
  candidates: McpCandidate[],
  toolDeps: string[],
): Promise<McpCandidate[]> {
  const candidateList = candidates
    .map((c, i) => {
      const vendorTag = c.vendor ? ' [VENDOR/OFFICIAL]' : '';
      return `${i}. "${c.name}"${vendorTag} (${c.stars} stars) — ${c.description.slice(0, 100)}`;
    })
    .join('\n');

  const scored = await llmJsonCall<ScoredCandidate[]>({
    system: SCORE_MCP_PROMPT,
    prompt: `TOOL DEPENDENCIES IN PROJECT:\n${toolDeps.join(', ')}\n\nMCP SERVER CANDIDATES:\n${candidateList}`,
    maxTokens: 4000,
  });

  if (!Array.isArray(scored)) return [];

  return scored
    .filter(s => s.score >= 60 && s.index >= 0 && s.index < candidates.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => ({
      ...candidates[s.index],
      score: s.score,
      reason: s.reason || candidates[s.index].description.slice(0, 80),
    }));
}
