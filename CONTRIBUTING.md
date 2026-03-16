# Contributing to Caliber

Thanks for your interest in contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/rely-ai-org/caliber.git
cd caliber
npm install
npm run dev      # Watch mode
npm run test     # Run tests
npm run build    # Compile
```

## Development

- **Build**: `npm run build` (tsup → `dist/`)
- **Watch**: `npm run dev`
- **Test**: `npm run test` (Vitest)
- **Type check**: `npx tsc --noEmit`
- **Single test**: `npx vitest run src/scoring/__tests__/accuracy.test.ts`

### Project structure

| Directory | Purpose |
|-----------|---------|
| `src/commands/` | CLI commands (init, score, skills, etc.) |
| `src/ai/` | LLM-powered generation, refinement, detection |
| `src/llm/` | Multi-provider LLM layer (Anthropic, Vertex, OpenAI, Claude CLI, Cursor) |
| `src/fingerprint/` | Project analysis (languages, deps, file tree) |
| `src/scoring/` | Deterministic config quality scoring |
| `src/writers/` | File writers for Claude/Cursor configs |
| `src/scanner/` | Local state detection |

### Key conventions

- ES module imports require `.js` extension (even for `.ts` source)
- Prefer `unknown` over `any`
- Tests live in `__tests__/` directories next to their source
- Global LLM mocks are in `src/test/setup.ts`

## Release channels

Caliber has two release channels:

| Branch | npm tag | Version format | Install |
|--------|---------|----------------|---------|
| `master` | `latest` | `1.20.0` | `npm i @rely-ai/caliber` |
| `next` | `next` | `1.20.0-next.1742140800` | `npm i @rely-ai/caliber@next` |

- **`master`** — stable releases. Merging here auto-publishes the official version.
- **`next`** — pre-release channel for testing risky or in-progress changes. Pushing here auto-publishes a dev version that won't affect `latest`.

### Testing with the next channel

```bash
# Install the latest pre-release
npm i @rely-ai/caliber@next

# Or run directly
npx @rely-ai/caliber@next score
```

## Pull requests

1. Fork the repo and create a branch from `master`
2. Make your changes
3. Add tests for new functionality
4. Run `npm run test` and `npx tsc --noEmit`
5. Use [conventional commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `chore:`
6. For risky changes, target the `next` branch instead of `master` to publish a pre-release first

## Reporting issues

Open an issue with:
- What you expected vs what happened
- Steps to reproduce
- Your environment (Node version, OS, provider used)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
