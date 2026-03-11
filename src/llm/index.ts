import type { LLMProvider, LLMConfig, LLMCallOptions } from './types.js';
import { loadConfig } from './config.js';
import { AnthropicProvider } from './anthropic.js';
import { VertexProvider } from './vertex.js';
import { OpenAICompatProvider } from './openai-compat.js';
import { CursorAcpProvider, isCursorAgentAvailable } from './cursor-acp.js';
import { ClaudeCliProvider, isClaudeCliAvailable } from './claude-cli.js';
import { parseJsonResponse, extractJson, estimateTokens } from './utils.js';

export type { LLMProvider, LLMConfig, LLMCallOptions };
export type { LLMStreamOptions, LLMStreamCallbacks, ProviderType } from './types.js';
export { loadConfig, writeConfigFile, getConfigFilePath } from './config.js';
export { parseJsonResponse, extractJson, estimateTokens };

let cachedProvider: LLMProvider | null = null;
let cachedConfig: LLMConfig | null = null;

function createProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'vertex':
      return new VertexProvider(config);
    case 'openai':
      return new OpenAICompatProvider(config);
    case 'cursor': {
      if (!isCursorAgentAvailable()) {
        throw new Error(
          'Cursor provider requires the Cursor Agent CLI. Install it from https://cursor.com/install then run `agent login`. Alternatively set ANTHROPIC_API_KEY or another provider.'
        );
      }
      return new CursorAcpProvider(config);
    }
    case 'claude-cli': {
      if (!isClaudeCliAvailable()) {
        throw new Error(
          'Claude Code provider requires the Claude Code CLI. Install it from https://claude.ai/install (or run `claude` once and log in). Alternatively set ANTHROPIC_API_KEY or choose another provider.'
        );
      }
      return new ClaudeCliProvider(config);
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export function getProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const config = loadConfig();
  if (!config) {
    throw new Error(
      'No LLM provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or VERTEX_PROJECT_ID; or run `caliber config` and choose Cursor or Claude Code; or set CALIBER_USE_CURSOR_SEAT=1 / CALIBER_USE_CLAUDE_CLI=1.'
    );
  }

  cachedConfig = config;
  cachedProvider = createProvider(config);
  return cachedProvider;
}

export function getConfig(): LLMConfig {
  if (cachedConfig) return cachedConfig;

  const config = loadConfig();
  if (!config) {
    throw new Error(
      'No LLM provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or VERTEX_PROJECT_ID; or run `caliber config` and choose Cursor or Claude Code; or set CALIBER_USE_CURSOR_SEAT=1 / CALIBER_USE_CLAUDE_CLI=1.'
    );
  }

  cachedConfig = config;
  return config;
}

export function resetProvider(): void {
  cachedProvider = null;
  cachedConfig = null;
}

export const TRANSIENT_ERRORS = ['terminated', 'ECONNRESET', 'ETIMEDOUT', 'socket hang up', 'other side closed'];
const MAX_RETRIES = 3;

function isTransientError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return TRANSIENT_ERRORS.some(e => msg.includes(e.toLowerCase()));
}

function isOverloaded(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.message.includes('529') || err.message.includes('overloaded');
}

export async function llmCall(options: LLMCallOptions): Promise<string> {
  const provider = getProvider();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await provider.call(options);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (isOverloaded(error) && attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (isTransientError(error) && attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      throw error;
    }
  }

  throw new Error('LLM call failed after max retries');
}

export async function llmJsonCall<T>(options: LLMCallOptions): Promise<T> {
  const text = await llmCall(options);
  return parseJsonResponse<T>(text);
}
