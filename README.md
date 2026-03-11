# Caliber

Open-source CLI that analyzes your project and generates optimized configuration files for AI coding agents (Claude Code, Cursor). Use your **current seat** (Claude Code Pro/Max/Team or Cursor subscription, no API key) or bring your own API key — supports Claude Code CLI (`claude -p`), Cursor (ACP), Anthropic, OpenAI, Google Vertex AI, and any OpenAI-compatible endpoint.

## Installation

```bash
npm install -g @rely-ai/caliber
```

## Quick Start

```bash
# Option 1: Use your current seat — no API key
caliber config   # choose "Claude Code" (Pro/Max/Team) or "Cursor"
# Or: export CALIBER_USE_CLAUDE_CLI=1  or  CALIBER_USE_CURSOR_SEAT=1

# Option 2: Set an API key
export ANTHROPIC_API_KEY=sk-ant-...

# Then run
caliber init
```

## What It Does

Caliber scans your codebase — languages, frameworks, file structure, existing configs — and generates tailored configuration files:

- **CLAUDE.md** — Project context for Claude Code (commands, architecture, conventions)
- **.cursorrules** / **.cursor/rules/** — Rules for Cursor
- **Skills** — Reusable skill files following the [OpenSkills](https://agentskills.io) standard

If you already have these files, Caliber audits them against your actual codebase and suggests targeted improvements — keeping what works, fixing what's stale, adding what's missing.

## Commands

| Command | Description |
|---------|-------------|
| `caliber init` | Scan project and generate agent config |
| `caliber update` | Re-analyze and regenerate (alias: `regenerate`, `regen`) |
| `caliber config` | Configure LLM: Cursor (your seat), API key, and model |
| `caliber refresh` | Update docs based on recent git changes |
| `caliber score` | Score your config quality (deterministic, no LLM). Supports `--agent claude\|cursor\|both` |
| `caliber recommend` | Discover skills from [skills.sh](https://skills.sh) |
| `caliber undo` | Revert all changes made by Caliber |
| `caliber status` | Show current setup status |
| `caliber hooks install` | Install Claude Code auto-refresh hook |
| `caliber hooks remove` | Remove Claude Code auto-refresh hook |
| `caliber hooks install-precommit` | Install git pre-commit hook for auto-refresh |
| `caliber hooks remove-precommit` | Remove git pre-commit hook |
| `caliber hooks status` | Show installed hooks |
| `caliber learn install` | Install session learning hooks |
| `caliber learn status` | Show learned insights from sessions |
| `caliber learn observe` | Manually feed a tool event for analysis |
| `caliber learn finalize` | Analyze captured events and extract patterns |
| `caliber learn remove` | Remove learning hooks |

## Supported LLM Providers

| Provider | How to use | Notes |
|----------|------------|-------|
| **Claude Code (current seat)** | `caliber config` → "Claude Code", or `CALIBER_USE_CLAUDE_CLI=1` | Uses your Pro/Max/Team login via `claude -p`. No API key; install [Claude Code CLI](https://claude.ai/install) and run `claude` once to log in. |
| **Cursor (current seat)** | `caliber config` → "Cursor", or `CALIBER_USE_CURSOR_SEAT=1` | Uses your Cursor subscription via [Cursor Agent (ACP)](https://cursor.com/docs/cli/acp). No API key; run `agent login` once if needed. |
| **Anthropic (Claude)** | `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 default. Get an API key at [console.anthropic.com](https://console.anthropic.com) (same company as Claude Pro/Team/Max; API is separate billing). |
| **Google Vertex AI** | `VERTEX_PROJECT_ID` or `GCP_PROJECT_ID` | Uses ADC by default. Region `us-east5`. Set `VERTEX_REGION`, `VERTEX_SA_CREDENTIALS` as needed. |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4.1 default. |
| **Custom endpoint** | `OPENAI_API_KEY` + `OPENAI_BASE_URL` | Any OpenAI-compatible API (Ollama, vLLM, Together, etc.) |

Override the model with `CALIBER_MODEL=<model-name>` or via `caliber config`.

### Vertex AI Setup

```bash
# Minimal — uses gcloud ADC and defaults
export VERTEX_PROJECT_ID=my-gcp-project
caliber init

# With custom region
export VERTEX_PROJECT_ID=my-gcp-project
export VERTEX_REGION=europe-west1
caliber init

# With service account credentials (inline JSON)
export VERTEX_PROJECT_ID=my-gcp-project
export VERTEX_SA_CREDENTIALS='{"type":"service_account",...}'
caliber init

# With service account credentials (file path via GOOGLE_APPLICATION_CREDENTIALS)
export VERTEX_PROJECT_ID=my-gcp-project
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
caliber init
```

## Flow: install and init

- **Install:** `npm install -g @caliber-ai/caliber` runs the postinstall script and prints the "Get started" message. With **npx** (`npx @caliber-ai/caliber init`), there is no install step; the binary runs from cache.
- **Config:** User runs `caliber config` (or sets env vars). Config is stored in `~/.caliber/config.json` or taken from `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `VERTEX_PROJECT_ID` / `CALIBER_USE_CLAUDE_CLI` / `CALIBER_USE_CURSOR_SEAT`.
- **Init:** `caliber init` calls `loadConfig()`: env vars override; if none, it reads `~/.caliber/config.json`. If no config, init prints the options and exits. Otherwise it scans the project, generates config with the chosen LLM (**Claude Code CLI**, Cursor ACP, Anthropic, OpenAI, or Vertex), then review and apply.

See [docs/FLOW.md](docs/FLOW.md) for the full step-by-step.

## How It Works

1. **Scan** — Analyzes your code, dependencies, file structure, and existing agent configs
2. **Generate** — LLM creates config files tailored to your project
3. **Review** — You accept, refine via chat, or decline the proposed changes
4. **Apply** — Config files are written to your project with backups, and a before/after score is displayed

Caliber also auto-generates `AGENTS.md` and configures `.claude/settings.json` permissions during init.

### Scoring

Caliber includes a deterministic scoring system (no LLM needed) that evaluates your agent config across 6 categories: existence, quality, coverage, accuracy, freshness, and bonus. Scoring is target-aware — it only checks what's relevant to your chosen platform:

```bash
caliber score               # Auto-detect target from existing files
caliber score --agent claude  # Score for Claude Code only
caliber score --agent both    # Score for Claude Code + Cursor
```

During `caliber init`, a before/after score is displayed so you can see the improvement.

### Auto-refresh

During `caliber init`, you'll be prompted to choose how docs auto-refresh:

- **Claude Code hook** — refreshes docs when Claude Code sessions end
- **Git pre-commit hook** — refreshes docs before each commit
- **Both** — enables both hooks
- **Skip** — install later with `caliber hooks install` or `caliber hooks install-precommit`

```bash
caliber hooks install              # Install Claude Code hook
caliber hooks install-precommit    # Install git pre-commit hook
caliber hooks remove               # Remove Claude Code hook
caliber hooks remove-precommit     # Remove pre-commit hook
caliber hooks status               # Show installed hooks
```

### Session Learning

Caliber can observe your Claude Code sessions and extract reusable instructions:

```bash
caliber learn install    # Install learning hooks
caliber learn status     # Check what's been captured
```

## Requirements

- Node.js >= 20
- An LLM: use your **Claude Code** or **Cursor** subscription (run `caliber config` → Claude Code or Cursor; for Claude Code run `claude` once to log in), or set an API key for Anthropic, OpenAI, or Vertex

## Contributing

```bash
git clone https://github.com/rely-ai-org/caliber.git
cd caliber
npm install
npm run dev      # Watch mode
npm run test     # Run tests
npm run build    # Compile
```

This project uses [conventional commits](https://www.conventionalcommits.org/) — `feat:` for features, `fix:` for bug fixes. See the [CLAUDE.md](./CLAUDE.md) for architecture details.

## License

MIT
