---
name: writers-pattern
description: Add a file writer in src/writers/ with a named export function returning string[] of written paths. Uses fs.writeFileSync, mkdirSync recursive, and YAML frontmatter for SKILL.md. Use when user says 'add writer', 'new platform output', 'write to disk', or modifies src/writers/. Do NOT read configs in writers—accept config as parameter. Do NOT call LLM inside writer.
---
# Writers Pattern

## Critical

- **Writers are pure I/O functions.** Never import LLM config, never call `llmCall()`, never read `.env`. Accept all inputs as parameters.
- **Return type is always `string[]`** — list of absolute paths written (for cleanup, undo, manifest).
- **Use `fs.writeFileSync(path, content)` + `mkdirSync(dir, { recursive: true })`** — no async, no streaming to disk.
- **YAML frontmatter for SKILL.md:** Must match `{ name: string, description: string, content: string }`. Use `toYamlFrontmatter()` from `src/writers/index.ts`.
- **All writers export a single named function** matching the pattern: `export function write<PlatformName>(config: Config, content: WriterInput): string[]`.

## Instructions

1. **Create the writer file** at `src/writers/<platform>/index.ts`.
   - Verify the directory does not exist yet.
   - Example: `src/writers/cursor/index.ts`, `src/writers/claude/index.ts`.

2. **Define the writer function** with signature: `export function write<PlatformName>(config: { projectRoot: string }, input: WriterInput): string[]`.
   - Input type: Match existing `WriterInput` from `src/writers/index.ts` (e.g., `{ claudeMd: string, skillsByName: Record<string, Skill>, agentsMd: string }`)
   - Verify function name is PascalCase: `writeCursor`, `writeClaude`, `writeCodex`.

3. **Create output directories** using `mkdirSync(path.join(config.projectRoot, targetDir), { recursive: true })`.
   - Verify directory structure matches the platform's spec (e.g., `.cursor/rules/`, `.codex/`, root for CLAUDE.md).

4. **Write all output files** using `fs.writeFileSync(filePath, content)`.
   - For SKILL.md files: Wrap skill content with `toYamlFrontmatter({ name, description, content })`.
   - Verify all paths are absolute (use `path.join()`).
   - This step uses the directory structure from Step 3.

5. **Collect and return all written paths** as `string[]`.
   - Verify array is non-empty and all paths are absolute.
   - Return in order written (for deterministic undo).

6. **Export the function in `src/writers/index.ts`** under the `WriterFunction` type.
   - Verify the function is imported and added to the main export.
   - Update the `writeSetup()` orchestrator to call the new writer.

7. **Add a test file** at `src/writers/<platform>/__tests__/index.test.ts` using Vitest.
   - Verify mock `fs` and `path` using `memfs`.
   - Test: function writes correct files, returns correct paths, handles missing config gracefully.

## Examples

**User says:** "Add a writer for Codex (OpenAI's platform)."

**Actions:**

1. Create `src/writers/codex/index.ts`:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { toYamlFrontmatter } from '../index.js';

export function writeCodex(
  config: { projectRoot: string },
  input: { claudeMd: string; skillsByName: Record<string, any>; agentsMd: string }
): string[] {
  const written: string[] = [];
  const codexDir = path.join(config.projectRoot, '.codex');
  fs.mkdirSync(codexDir, { recursive: true });

  // Write CLAUDE.md
  const claudePath = path.join(codexDir, 'CLAUDE.md');
  fs.writeFileSync(claudePath, input.claudeMd);
  written.push(claudePath);

  // Write skills
  const skillsDir = path.join(codexDir, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });
  for (const [name, skill] of Object.entries(input.skillsByName)) {
    const skillPath = path.join(skillsDir, `${name}.md`);
    const frontmatter = toYamlFrontmatter(skill);
    fs.writeFileSync(skillPath, frontmatter);
    written.push(skillPath);
  }

  return written;
}
```

2. Update `src/writers/index.ts`:
```typescript
export { writeCodex } from './codex/index.js';
// In writeSetup():
const codexPaths = writeCodex(config, writerInput);
written.push(...codexPaths);
```

3. Create `src/writers/codex/__tests__/index.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import { writeCodex } from '../index';

vi.mock('fs');

describe('writeCodex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes CLAUDE.md and skill files', () => {
    const input = {
      claudeMd: '# Test',
      skillsByName: { 'test-skill': { name: 'test', description: 'test', content: 'test' } },
      agentsMd: ''
    };
    const paths = writeCodex({ projectRoot: '/test' }, input);
    expect(paths).toHaveLength(2);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });
});
```

**Result:** Writer added, exports function that writes 2 files, test passes.

## Common Issues

**"Cannot find module 'toYamlFrontmatter'"**
- Verify import: `import { toYamlFrontmatter } from '../index.js'`
- Check that `src/writers/index.ts` exports the function
- Run `npm run build` to regenerate `dist/`

**"ENOENT: no such file or directory"**
- Verify `mkdirSync(..., { recursive: true })` is called BEFORE `writeFileSync()`
- Check that all parent directories in the path are created
- Ensure `config.projectRoot` is absolute: `path.isAbsolute(config.projectRoot)` must be `true`

**"Function not called in writeSetup()"**
- Verify the writer function is imported in `src/writers/index.ts`
- Check that `writeSetup()` calls the function: `const paths = write<Name>(config, input);`
- Verify the result is pushed to the `written` array: `written.push(...paths);`

**"Paths are relative, not absolute"**
- Verify all paths use `path.join(config.projectRoot, relativeSegments)` — not string concatenation
- Ensure no paths start with `./` or `../`
- Test: `path.isAbsolute(writtenPath)` must be `true` for all returned paths

**"Skill YAML frontmatter malformed"**
- Verify `toYamlFrontmatter()` is called: receives `{ name: string, description: string, content: string }`
- Check that `content` field contains the markdown body (NOT frontmatter)
- Ensure all string fields are escaped (quotes, newlines) — `toYamlFrontmatter` handles this