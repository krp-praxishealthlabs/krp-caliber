# CLAUDE.md — Caliber

## What Is This

`@rely-ai/caliber` — CLI that fingerprints projects and generates AI agent configs (`CLAUDE.md`, `.cursor/rules/`, `AGENTS.md`, skills). Supports Anthropic, OpenAI, Google Vertex AI, any OpenAI-compatible endpoint, Claude Code CLI, and Cursor ACP.

## Commands

```bash
npm run build          # tsup → dist/
npm run dev            # tsup --watch
npm run test           # Vitest run
npm run test:watch     # Vitest watch
npm run test:coverage  # v8 coverage
npx tsc --noEmit       # type-check only
```

```bash
npm publish --access public   # publish @rely-ai/caliber to npm
npm version patch             # bump patch version before publish
```

```bash
caliber init       # generate configs
caliber score      # run scoring checks
caliber refresh    # diff-based update
caliber learn finalize  # finalize learnings
```

## Architecture

**Entry**: `src/bin.ts` → `src/cli.ts` (Commander.js) · commands wrapped with `tracked()` for telemetry

**LLM** (`src/llm/`): `types.ts` · `config.ts` · `anthropic.ts` · `vertex.ts` · `openai-compat.ts` · `claude-cli.ts` · `cursor-acp.ts` · `utils.ts` (`extractJson`, `estimateTokens`) · `usage.ts` (`trackUsage`) · `seat-based-errors.ts` (`parseSeatBasedError`) · `model-recovery.ts` · `index.ts` (`llmCall`, `llmJsonCall`, `TRANSIENT_ERRORS`)

**AI** (`src/ai/`): `generate.ts` · `refine.ts` · `refresh.ts` · `learn.ts` · `detect.ts` · `prompts.ts` · `score-refine.ts` · `stream-parser.ts`

**Commands** (`src/commands/`): `init.ts` · `regenerate.ts` · `status.ts` · `undo.ts` · `config.ts` · `score.ts` · `refresh.ts` · `hooks.ts` · `learn.ts` · `recommend.ts` · `insights.ts` · `setup-files.ts`

**Fingerprint** (`src/fingerprint/`): `git.ts` · `file-tree.ts` · `existing-config.ts` · `code-analysis.ts` · `cache.ts` · `index.ts` (`collectFingerprint`, `computeFingerprintHash`)

**Writers** (`src/writers/`): `claude/index.ts` · `cursor/index.ts` · `codex/index.ts` · `staging.ts` · `manifest.ts` · `backup.ts` · `refresh.ts` · `index.ts` (`writeSetup`, `undoSetup`)

**Scoring** (`src/scoring/`): Deterministic, no LLM. Checks in `src/scoring/checks/` — `existence.ts` · `quality.ts` · `grounding.ts` · `accuracy.ts` · `freshness.ts` · `bonus.ts`. Constants in `src/scoring/constants.ts`. Display via `src/scoring/display.ts`. Score refinement in `src/ai/score-refine.ts`.

**Learner** (`src/learner/`): `storage.ts` · `writer.ts` · `roi.ts` · `stdin.ts` · `utils.ts`

**Scanner** (`src/scanner/index.ts`): `detectPlatforms()` · `scanLocalState()` · `compareState()`

**Lib** (`src/lib/`): `hooks.ts` · `learning-hooks.ts` · `git-diff.ts` · `state.ts` · `lock.ts` · `sanitize.ts` · `notifications.ts` · `resolve-caliber.ts` · `debug-report.ts`

**Telemetry** (`src/telemetry/`): `index.ts` (`trackEvent`, `initTelemetry`, `flushTelemetry`) · `events.ts` · `config.ts` — via `posthog-node`

## LLM Provider Resolution

1. `ANTHROPIC_API_KEY` → Anthropic (`claude-sonnet-4-6`)
2. `VERTEX_PROJECT_ID` / `GCP_PROJECT_ID` → Vertex (`us-east5`)
3. `OPENAI_API_KEY` → OpenAI (`gpt-4.1`; `OPENAI_BASE_URL` for custom endpoints)
4. `CALIBER_USE_CURSOR_SEAT=1` → Cursor ACP (`agent --print --trust`)
5. `CALIBER_USE_CLAUDE_CLI=1` → Claude Code CLI (`claude -p`)
6. `~/.caliber/config.json` — written by `caliber config`
7. `CALIBER_MODEL` — overrides model · `CALIBER_FAST_MODEL` — overrides fast model

Fast model (lightweight tasks): `claude-haiku-4-5-20251001` (Anthropic/Vertex), `gpt-4.1-mini` (OpenAI), `gpt-5.3-codex-fast` (Cursor).

## Key Conventions

- **ES module imports require `.js` extension** even for `.ts` source files
- Prefer `unknown` over `any`; explicit types on params/returns
- `throw new Error('__exit__')` — clean CLI exit, no stack trace
- Use `ora` spinners with `.fail()` before rethrowing async errors
- JSON from LLM: always use `extractJson()` from `src/llm/utils.ts`
- Seat-based providers (`cursor`, `claude-cli`): spawn with `stdio: ['pipe', 'pipe', 'pipe']` — never `inherit` for stderr
- Error parsing for seat-based providers: use `parseSeatBasedError()` from `src/llm/seat-based-errors.ts`
- Telemetry via `posthog-node` — wrap commands with `tracked()` in `src/cli.ts`
- API keys stored in `~/.caliber/config.json` with `0600` permissions
- Backups written to `.caliber/backups/` · manifest at `.caliber/manifest.json`
- Session events stored in `.caliber/learning/current-session.jsonl`
- Fingerprint cache at `.caliber/cache/fingerprint.json` — invalidated by git HEAD or tree signature change
- Dismissed checks stored in `.caliber/dismissed-checks.json`
- Staged proposals written to `.caliber/staged/proposed/` via `src/writers/staging.ts`
- `src/ai/score-refine.ts`: `validateSetup()` + `scoreAndRefine()` — auto-fixes scoring issues before writing
- GitHub Action in `github-action/index.js` + `github-action/action.yml` — scores PRs and posts comments

## Commit Convention

`feat:` → minor · `fix:`/`refactor:`/`chore:` → patch · `feat!:` → major
Do NOT include Co-Authored-By headers in commits.

<!-- caliber:managed:pre-commit -->
## Before Committing

Run `caliber refresh` before creating git commits to keep docs in sync with code changes.
After it completes, stage any modified doc files before committing:

```bash
caliber refresh && git add CLAUDE.md .claude/ .cursor/ AGENTS.md CALIBER_LEARNINGS.md 2>/dev/null
```
<!-- /caliber:managed:pre-commit -->

<!-- caliber:managed:learnings -->
## Session Learnings

Read `CALIBER_LEARNINGS.md` for patterns and anti-patterns learned from previous sessions.
These are auto-extracted from real tool usage — treat them as project-specific rules.
<!-- /caliber:managed:learnings -->
