---
name: writers-pattern
description: Creates a new file writer in src/writers/ following the established pattern. Writers export a named async function that takes config objects and returns string[] of written file paths. Use when adding support for new platforms, config file formats, or modifying output generation. Includes YAML frontmatter for SKILL.md files and uses fs.writeFileSync for synchronous writes. Do NOT use for reading or parsing existing configs—use fingerprint pattern instead.
---
# Writers Pattern

## Critical

- Writers MUST export a named async function (not default export) that returns `Promise<string[]>` of written file paths
- SKILL.md files MUST include YAML frontmatter block at the top:
  ```yaml
  ---
  name: skill-name
  description: brief description
  ---
  ```
- Use `fs.writeFileSync()` directly; do NOT use higher-level abstractions
- All written paths MUST be relative to project root (e.g., `.cursor/rules/example.md`)
- Verify the target directory exists before writing; use `fs.mkdirSync(dir, { recursive: true })`
- Return empty array `[]` only if no files were actually written

## Instructions

1. **Create the writer file in `src/writers/`**
   - File naming: `<platform>.ts` (e.g., `claude.ts`, `cursor.ts`, `codex.ts`)
   - Import required modules at the top:
     ```typescript
     import fs from 'fs';
     import path from 'path';
     ```
   - Verify: Writer file exists and compiles with `npm run build`

2. **Define the exported async function signature**
   - Function name matches file purpose (e.g., `writeCursorRules`, `writeClaudeConfig`)
   - Accepts parameters matching the config objects from `src/types.ts` (e.g., `config: Config`, `skills: Skill[]`)
   - Return type: `Promise<string[]>`
   - Example:
     ```typescript
     export async function writeCursorRules(
       config: Config,
       rules: Rule[]
     ): Promise<string[]> {
       const written: string[] = [];
       // implementation
       return written;
     }
     ```
   - Verify: Function signature matches existing writers in `src/writers/claude/index.ts`, `src/writers/cursor/index.ts`

3. **Create output directory structure**
   - Determine target directory (e.g., `.cursor/rules/`, `docs/`, `.ai/`)
   - Call `fs.mkdirSync(targetDir, { recursive: true })` before writing
   - Example:
     ```typescript
     const rulesDir = path.join(process.cwd(), '.cursor', 'rules');
     fs.mkdirSync(rulesDir, { recursive: true });
     ```
   - Verify: Directory creation does not throw EACCES or permission errors

4. **For SKILL.md files, prepend YAML frontmatter**
   - Frontmatter block must be first lines of file:
     ```yaml
     ---
     name: skill-name-kebab-case
     description: what this skill does
     ---
     ```
   - Follow with markdown body (no additional frontmatter separators)
   - Example:
     ```typescript
     const skillContent = `---
name: example-skill
description: does something useful
---

# Example Skill

Instructions here...`;
     fs.writeFileSync(skillPath, skillContent, 'utf-8');
     ```
   - Verify: Skill file renders correctly with `cat .cursor/rules/example.md` and frontmatter is valid YAML

5. **Track written paths and return array**
   - Push each successfully written file path to `written` array
   - Paths must be relative to project root (e.g., `.cursor/rules/security.md`, not `/absolute/path`)
   - Example:
     ```typescript
     const skillPath = path.join(rulesDir, 'security.md');
     fs.writeFileSync(skillPath, skillContent, 'utf-8');
     written.push(path.relative(process.cwd(), skillPath));
     return written;
     ```
   - Verify: All returned paths use forward slashes and are relative (no leading `/`)

6. **Export function in `src/writers/index.ts`**
   - Add named export: `export { writeCursorRules } from './cursor';`
   - Verify: `npm run build` succeeds and function is importable from `src/writers/index.ts`

## Examples

**User says:** "Add a new writer for generating JSON config files in `.caliber/config.json`"

**Actions taken:**
1. Create `src/writers/json-config.ts`
2. Write function signature:
   ```typescript
   import fs from 'fs';
   import path from 'path';

   export async function writeJsonConfig(config: Config): Promise<string[]> {
     const written: string[] = [];
     const configDir = path.join(process.cwd(), '.caliber');
     fs.mkdirSync(configDir, { recursive: true });
     
     const configPath = path.join(configDir, 'config.json');
     fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
     written.push(path.relative(process.cwd(), configPath));
     
     return written;
   }
   ```
3. Add to `src/writers/index.ts`: `export { writeJsonConfig } from './json-config';`
4. Run `npm run build` — verify no errors
5. Return: `['.caliber/config.json']`

**User says:** "Add a skill writer that generates SKILL.md files with YAML frontmatter"

**Actions taken:**
1. Create `src/writers/skills.ts`
2. Write function:
   ```typescript
   export async function writeSkills(skills: Skill[]): Promise<string[]> {
     const written: string[] = [];
     const skillsDir = path.join(process.cwd(), '.cursor', 'rules');
     fs.mkdirSync(skillsDir, { recursive: true });
     
     for (const skill of skills) {
       const content = `---
name: ${skill.name}
description: ${skill.description}
---

${skill.body}`;
       const skillPath = path.join(skillsDir, `${skill.name}.md`);
       fs.writeFileSync(skillPath, content, 'utf-8');
       written.push(path.relative(process.cwd(), skillPath));
     }
     return written;
   }
   ```
3. Export in `src/writers/index.ts`
4. Verify with: `cat .cursor/rules/example-skill.md` shows valid frontmatter

## Common Issues

**Error: `ENOENT: no such file or directory`**
- Cause: Target directory does not exist
- Fix: Add `fs.mkdirSync(targetDir, { recursive: true })` before `fs.writeFileSync()`
- Verify: `ls -la .cursor/rules/` shows directory was created

**Error: `EACCES: permission denied`**
- Cause: No write permissions to target directory
- Fix: Check file permissions: `ls -la .cursor/` and ensure current user owns directory
- If using Docker: ensure volume mounts have correct permissions

**Error: `Function returns Promise but should return string[]`**
- Cause: Forgot `async` keyword in function declaration
- Fix: Change `function writeCursor(...)` to `async function writeCursor(...)`
- Verify: Return type is `Promise<string[]>` not `string[]`

**Frontmatter not rendering in SKILL.md**
- Cause: YAML block not first lines of file or missing closing `---`
- Fix: Ensure template is exactly:
  ```
  ---
  name: skill-name
  description: description
  ---
  
  # Markdown body starts here
  ```
- Verify: `head -5 .cursor/rules/skill.md` shows `---` on line 1 and line 4

**Returned paths have absolute paths instead of relative**
- Cause: Forgot to use `path.relative(process.cwd(), fullPath)`
- Fix: Always wrap full paths with `path.relative(process.cwd(), ...)`
- Verify: `console.log(written[0])` shows `.cursor/rules/...` not `/home/user/project/...`

**Export not found in src/writers/index.ts**
- Cause: Function not added to barrel export
- Fix: Add `export { writeNewFormat } from './new-format';` to `src/writers/index.ts`
- Verify: `npm run build` succeeds and `import { writeNewFormat } from './writers'` works