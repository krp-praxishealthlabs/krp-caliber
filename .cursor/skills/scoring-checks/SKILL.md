---
name: scoring-checks
description: Adds a deterministic scoring check to src/scoring/checks/ implementing Check interface from src/scoring/index.ts with run(dir:string):Check[]. Point values from src/scoring/constants.ts. Use when user says 'add scoring check', 'new check', 'scoring validation'. Do NOT make LLM calls in checks—must be synchronous and filesystem-based only.
---
# Scoring Checks

## Critical

- **No LLM calls.** Checks run deterministically. Use only filesystem operations, glob, and string parsing.
- **Check interface compliance.** Every check must export a `run(dir: string): Check[]` function returning an array of `Check` objects.
- **Point values from constants.** Use `src/scoring/constants.ts` for point assignments. Do NOT hardcode values.
- **Synchronous only.** No promises or async. Scoring runs in-band during `score` command.
- **Idempotent results.** Same directory state must always produce same check results.

## Instructions

1. **Study the Check interface** in `src/scoring/index.ts`.
   - Verify the shape: `{ name: string; points: number; reason: string; pass: boolean; rule?: string }`
   - Note: `rule` is optional; use for referencing scoring constants or CLAUDE.md sections.
   - Validation: Open `src/scoring/index.ts` and confirm the exact interface.

2. **Pick a point value from `src/scoring/constants.ts`** for your check.
   - Examples: `POINTS.CLAUDE_MD` (20), `POINTS.AGENTS_MD` (15), `POINTS.CURSOR_RULES_EXIST` (10).
   - Validation: Grep the constants file for the relevant key. If it doesn't exist, add it.

3. **Create a new file** at `src/scoring/checks/<check-name>.ts`.
   - Naming: Use kebab-case: `src/scoring/checks/my-new-check.ts`.
   - Validation: Confirm file does not already exist.

4. **Import required modules** at the top:
   ```typescript
   import { globSync } from 'glob';
   import { existsSync, readFileSync } from 'fs';
   import path from 'path';
   import type { Check } from '../index';
   import { POINTS } from '../constants';
   ```

5. **Implement `run(dir: string): Check[]`** function:
   - Accept `dir` parameter (project root).
   - Perform filesystem checks: file existence, glob patterns, file content parsing.
   - Return array with one `Check` object per result (usually length 1).
   - Example structure:
     ```typescript
     export function run(dir: string): Check[] {
       const filePath = path.join(dir, 'CLAUDE.md');
       const pass = existsSync(filePath);
       return [{
         name: 'CLAUDE.md exists',
         points: POINTS.CLAUDE_MD,
         reason: 'CLAUDE.md documents project context',
         pass,
         rule: 'CLAUDE.md'
       }];
     }
     ```
   - Validation: Check runs without throwing. Try/catch filesystem errors and return `pass: false`.

6. **Register the check** in `src/scoring/index.ts`.
   - Import your check file: `import { run as runMyCheck } from './checks/my-new-check'`.
   - Add to the `runs` array inside the scoring function (e.g., in a for-loop or array concat).
   - Validation: Grep `src/scoring/index.ts` for how existing checks are registered.

7. **Test the check** with `npm run test -- src/scoring/__tests__/checks.test.ts`.
   - Create or update test file if it doesn't exist.
   - Test structure: Mock filesystem with `memfs`, call `run(mockDir)`, assert `pass` and `points`.
   - Validation: Test passes; coverage ≥80%.

## Examples

**User says:** "Add a check to verify `.cursor/rules.json` exists and is valid JSON."

**Actions:**
1. Study `src/scoring/index.ts` — confirm `Check` type shape.
2. Check `src/scoring/constants.ts` — find or add `POINTS.CURSOR_RULES_JSON`.
3. Create `src/scoring/checks/cursor-rules-json.ts`:
   ```typescript
   import { existsSync, readFileSync } from 'fs';
   import path from 'path';
   import type { Check } from '../index';
   import { POINTS } from '../constants';

   export function run(dir: string): Check[] {
     const filePath = path.join(dir, '.cursor', 'rules.json');
     let pass = false;
     let reason = '.cursor/rules.json missing or invalid';

     if (existsSync(filePath)) {
       try {
         const content = readFileSync(filePath, 'utf-8');
         JSON.parse(content);
         pass = true;
         reason = '.cursor/rules.json exists and is valid JSON';
       } catch (e) {
         reason = '.cursor/rules.json exists but is not valid JSON';
       }
     }

     return [{
       name: 'Cursor rules JSON valid',
       points: POINTS.CURSOR_RULES_JSON,
       reason,
       pass,
       rule: 'Cursor ACP'
     }];
   }
   ```
4. Register in `src/scoring/index.ts`: Add `import { run as runCursorRulesJson } from './checks/cursor-rules-json'` and append to checks array.
5. Test in `src/scoring/__tests__/checks.test.ts`: Mock `.cursor/rules.json`, call `run()`, assert `pass === true` and `points > 0`.

**Result:** Scoring now deducts points if `.cursor/rules.json` is missing or malformed.

## Common Issues

- **"Check is not in the runs array."** → Verify you imported the `run` function and added it to the checks array in `src/scoring/index.ts`. Grep for existing check registrations.
- **"Check returns async promise, fails during score."** → Remove any `await`, `async`, or promises. Use only `fs.readFileSync` and `fs.existsSync`.
- **"Point value undefined (POINTS.MY_KEY not found)."** → Add the constant to `src/scoring/constants.ts` first. Example: `MY_NEW_CHECK: 15` (adjust point value based on severity).
- **"Test fails with 'ENOENT: no such file or directory'."** → Use `memfs` in tests to mock the filesystem. See existing tests in `src/scoring/__tests__/`.
- **"Check always returns pass: false even when file exists."** → Verify the glob pattern or file path is relative to `dir`. Use `path.join(dir, 'relative/path')` not absolute paths.