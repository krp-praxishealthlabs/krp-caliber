# CLAUDE.md — Caliber

## What Is This

`@rely-ai/caliber` — CLI that fingerprints projects and generates AI agent configs (CLAUDE.md, .cursor/rules/, skills). Supports Anthropic (`@anthropic-ai/sdk`), OpenAI (`openai`), Google Vertex AI (`@anthropic-ai/vertex-sdk`, `google-auth-library`), and any OpenAI-compatible endpoint.

## Monorepo Layout

| Dir | Purpose |
|-----|---------|
| `src/` | Main CLI source (published package) |
| `apps/api/` | Internal API server |
| `apps/web/` | Internal web frontend |
| `packages/mcp-server/` | MCP server package |
| `packages/shared/` | Shared utilities |

## Commands

```bash
npm run build                    # Compile via tsup → dist/
npm run dev                      # Watch mode (tsup --watch)
npm run test                     # Run Vitest suite
npm run test -- --coverage       # v8 coverage report
npx tsc --noEmit                 # Type-check only
npx vitest run src/scoring/__tests__/accuracy.test.ts  # Single file
```

## Architecture

**Entry**: `src/bin.ts` → `src/cli.ts` (Commander.js, all commands)

**LLM** (`src/llm/`): `types.ts` interface · `config.ts` (env → `~/.caliber/config.json`, `DEFAULT_MODELS`) · `anthropic.ts` · `vertex.ts` · `openai-compat.ts` · `utils.ts` (`extractJson`, `estimateTokens`) · `index.ts` (`llmCall`, `llmJsonCall`, retry/backoff)

**AI** (`src/ai/`): `generate.ts` (streaming init) · `refine.ts` (chat refinement) · `refresh.ts` (diff-based updates) · `learn.ts` (session analysis) · `detect.ts` (LLM framework detection) · `prompts.ts` (all system prompts)

**Commands** (`src/commands/`): `onboard` (alias `init`), `regenerate` (alias `update`/`regen`), `status`, `undo`, `config`, `recommend`, `score`, `refresh`, `hooks`, `learn`

**Fingerprint** (`src/fingerprint/`): `git.ts` · `languages.ts` · `package-json.ts` (uses `glob`/`globSync`) · `file-tree.ts` · `existing-config.ts` · `code-analysis.ts` · `index.ts` (orchestrates + `enrichFingerprintWithLLM`)

**Writers** (`src/writers/`): `claude/` · `cursor/` · `staging.ts` (buffer before confirm) · `manifest.ts` (`.caliber/manifest.json`) · `backup.ts` (`.caliber/backups/`) · `refresh.ts`

**Scoring** (`src/scoring/`): Deterministic, no LLM. Categories: existence · quality · coverage · accuracy · freshness · bonus. Constants in `scoring/constants.ts`. Run: `caliber score`.

**Learner** (`src/learner/`): `storage.ts` (session events → `.caliber/learning/`) · `writer.ts` · `stdin.ts`. Finalize: `caliber learn finalize`.

**Scanner** (`src/scanner/index.ts`): `detectPlatforms()` · `scanLocalState()` · `compareState()`

## LLM Provider Resolution

1. `ANTHROPIC_API_KEY` → Anthropic (`claude-sonnet-4-6`)
2. `VERTEX_PROJECT_ID` / `GCP_PROJECT_ID` → Vertex (`us-east5`; ADC, `VERTEX_SA_CREDENTIALS`, or `GOOGLE_APPLICATION_CREDENTIALS`)
3. `OPENAI_API_KEY` → OpenAI (`gpt-4.1`; `OPENAI_BASE_URL` for custom endpoints)
4. `~/.caliber/config.json` — written by `caliber config`
5. `CALIBER_MODEL` — overrides model for any provider

## Testing

- **Framework**: Vitest (`globals: true`, `environment: node`)
- **Setup**: `src/test/setup.ts` — globally mocks `llmCall`/`llmJsonCall`/`getProvider`
- **Location**: `src/**/__tests__/*.test.ts`
- **Coverage**: v8; excludes `src/test/`, `src/bin.ts`, `src/cli.ts`, `src/commands/**`, `dist/**`

## Key Conventions

- **ES module imports require `.js` extension** even for `.ts` source files
- Strict mode, ES2022 target, `moduleResolution: bundler`
- Prefer `unknown` over `any`; explicit types on params/returns
- `throw new Error('__exit__')` — clean CLI exit, no stack trace
- Use `ora` spinners with `.fail()` before rethrowing async errors
- Transient LLM errors auto-retry in `llmCall()` via `TRANSIENT_ERRORS`
- Key deps: `commander`, `chalk`, `ora`, `@inquirer/confirm`, `@inquirer/select`, `glob`, `tsup`

## Commit Convention

`feat:` → minor · `fix:`/`refactor:`/`chore:` → patch · `feat!:` → major
Scope optional: `feat(scanner): detect Cursor config`

## Permissions

See `.claude/settings.json`. Never commit API keys or credentials.
