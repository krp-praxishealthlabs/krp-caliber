<p align="center">
  <img src="assets/social-preview.svg" alt="Caliber" width="640">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@rely-ai/caliber"><img src="https://img.shields.io/npm/v/@rely-ai/caliber" alt="npm version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@rely-ai/caliber" alt="license"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/@rely-ai/caliber" alt="node"></a>
</p>

<p align="center"><strong>Analyze your codebase. Generate optimized AI agent configs. One command.</strong></p>

Caliber scans your project — languages, frameworks, dependencies, file structure — and generates tailored config files for Claude Code and Cursor. If configs already exist, it audits them and suggests improvements.

**No API key required** — use your existing Claude Code or Cursor subscription. Or bring your own key (Anthropic, OpenAI, Vertex AI, any OpenAI-compatible endpoint).

## Quick Start

```bash
npx @rely-ai/caliber onboard
```

That's it. On first run, Caliber walks you through provider setup interactively.

Or install globally:

```bash
npm install -g @rely-ai/caliber
caliber onboard
```

> **Already have an API key?** Skip the interactive setup:
> ```bash
> export ANTHROPIC_API_KEY=sk-ant-...
> npx @rely-ai/caliber onboard
> ```

## How It Works

```
caliber onboard
│
├─ 1. Scan        Analyze languages, frameworks, dependencies, file structure,
│                  and existing agent configs in your project
│
├─ 2. Generate    LLM creates tailored config files based on your codebase
│                  (or audits existing ones and suggests improvements)
│
├─ 3. Review      You see a diff of proposed changes — accept, refine via
│                  chat, or decline
│
└─ 4. Apply       Files are written with automatic backups, before/after
                   score is displayed
```

### What It Generates

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project context for Claude Code — commands, architecture, conventions |
| `.cursorrules` / `.cursor/rules/` | Rules for Cursor |
| Skills (`.claude/skills/`, `.cursor/skills/`) | Reusable skill files following the [OpenSkills](https://agentskills.io) standard |
| `AGENTS.md` | Agent collaboration guide |

If these files already exist, Caliber audits them against your actual codebase and suggests targeted improvements — keeping what works, fixing what's stale, adding what's missing.

## Commands

| Command | Description |
|---------|-------------|
| `caliber onboard` | Onboard your project for AI-assisted development |
| `caliber score` | Score your config quality (deterministic, no LLM needed) |
| `caliber recommend` | Discover and install skills from [skills.sh](https://skills.sh) |
| `caliber config` | Configure LLM provider, API key, and model |

```bash
caliber onboard --agent claude      # Target Claude Code only
caliber onboard --agent cursor      # Target Cursor only
caliber onboard --agent both        # Target both
caliber onboard --dry-run           # Preview without writing files
caliber score --json             # Machine-readable output
```

## LLM Providers

| Provider | Setup | Notes |
|----------|-------|-------|
| **Claude Code** (your seat) | `caliber config` → Claude Code | No API key. Uses your Pro/Max/Team login via `claude -p`. |
| **Cursor** (your seat) | `caliber config` → Cursor | No API key. Uses your subscription via Cursor Agent (ACP). |
| **Anthropic** | `export ANTHROPIC_API_KEY=sk-ant-...` | Claude Sonnet 4.6 default. [Get key](https://console.anthropic.com). |
| **OpenAI** | `export OPENAI_API_KEY=sk-...` | GPT-4.1 default. |
| **Vertex AI** | `export VERTEX_PROJECT_ID=my-project` | Uses ADC. Region `us-east5`. |
| **Custom endpoint** | `OPENAI_API_KEY` + `OPENAI_BASE_URL` | Any OpenAI-compatible API (Ollama, vLLM, Together, etc.) |

Override the model for any provider: `export CALIBER_MODEL=<model-name>` or use `caliber config`.

<details>
<summary>Vertex AI advanced setup</summary>

```bash
# Custom region
export VERTEX_PROJECT_ID=my-gcp-project
export VERTEX_REGION=europe-west1

# Service account credentials (inline JSON)
export VERTEX_PROJECT_ID=my-gcp-project
export VERTEX_SA_CREDENTIALS='{"type":"service_account",...}'

# Service account credentials (file path)
export VERTEX_PROJECT_ID=my-gcp-project
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

</details>

## Requirements

- Node.js >= 20
- One LLM provider: your **Claude Code** or **Cursor** subscription (no API key), or an API key for Anthropic / OpenAI / Vertex AI

## Contributing

```bash
git clone https://github.com/rely-ai-org/caliber.git
cd caliber
npm install
npm run dev      # Watch mode
npm run test     # Run tests
npm run build    # Compile
```

Uses [conventional commits](https://www.conventionalcommits.org/) — `feat:` for features, `fix:` for bug fixes.

## License

MIT
