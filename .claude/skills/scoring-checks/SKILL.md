---
name: scoring-checks
description: Adds a new deterministic scoring check to src/scoring/checks/ implementing the Check interface from src/scoring/index.ts. Point values from src/scoring/constants.ts. Checks receive dir:string and return Check[]. Use when user says 'add scoring check', 'new check', 'score X', or modifies src/scoring/. Do NOT use for LLM-based scoring, real-time validation, or checks requiring external API calls.
---
# Scoring Checks

## Critical

1. **Checks are deterministic and synchronous.** No LLM calls, no async operations, no external APIs. Use only filesystem reads and sync analysis.
2. **Every check must implement the `Check` interface** from `src/scoring/index.ts`:
   ```typescript
   export interface Check {
     id: string;           // kebab-case, e.g., "claude-md-exists"
     label: string;        // Human-readable, e.g., "CLAUDE.md exists"
     points: number;       // From src/scoring/constants.ts
     passed: boolean;      // true/false
     details?: string;     // Optional explanation
   }
   ```
3. **Points must be defined in `src/scoring/constants.ts` BEFORE the check.** Do not hardcode point values in the check file.
4. **Each check file must export a function with signature:** `export function checkName(dir: string): Check[]` that returns an array of Check objects.
5. **Import and register the check in `src/scoring/index.ts`** in the `runChecks()` function.

## Instructions

1. **Define point value in `src/scoring/constants.ts`**
   - Add constant: `export const CHECK_NAME_POINTS = <number>;`
   - Example: `export const CLAUDE_MD_EXISTS_POINTS = 15;`
   - Verify the constant is exported and value aligns with project scoring scale (typically 5–50 points per check)

2. **Create the check file at `src/scoring/checks/<check-name>.ts`**
   - File name must be kebab-case (e.g., `claude-md-exists.ts`)
   - Verify the file path follows existing pattern: see `src/scoring/checks/existence.ts`, `quality.ts`, etc.

3. **Implement the check function with the Check interface**
   ```typescript
   import { Check } from '../index';
   import { CHECK_NAME_POINTS } from '../constants';
   import { existsSync } from 'fs';

   export function checkName(dir: string): Check[] {
     const filePath = `${dir}/path/to/check`;
     const passed = existsSync(filePath);
     return [{
       id: 'check-id',
       label: 'Human label',
       points: CHECK_NAME_POINTS,
       passed,
       details: passed ? 'Found.' : 'Not found.'
     }];
   }
   ```
   - Use `existsSync`, `readFileSync`, `statSync` from `fs` module (sync only)
   - Use `glob.sync()` for multi-file patterns
   - Return an array (even single checks must be wrapped in `[]`)
   - Verify the check handles missing files gracefully (returns `passed: false`, not throws)

4. **Import and call the check in `src/scoring/index.ts`**
   - Add import: `import { checkName } from './checks/<check-name>';`
   - Add call in `runChecks(dir: string)` function:
     ```typescript
     const checks: Check[] = [];
     checks.push(...checkName(dir));
     ```
   - Verify the function is called before the final return statement

5. **Write tests in `src/scoring/__tests__/<check-name>.test.ts`**
   - Use Vitest and `memfs` for isolated filesystem
   - Example:
     ```typescript
     import { describe, it, expect, beforeEach } from 'vitest';
     import { vol } from 'memfs';
     import { checkName } from '../checks/<check-name>';

     describe('checkName', () => {
       beforeEach(() => vol.reset());
       it('passes when file exists', () => {
         vol.fromJSON({ '/project/file.md': 'content' });
         const result = checkName('/project');
         expect(result[0].passed).toBe(true);
       });
       it('fails when file missing', () => {
         const result = checkName('/project');
         expect(result[0].passed).toBe(false);
       });
     });
     ```
   - Verify both pass and fail cases are tested

6. **Run scoring tests to validate**
   - Execute: `npm run test -- src/scoring`
   - Verify all new tests pass and the check integrates without errors
   - Verify the check appears in `caliber score` output

## Examples

**User says:** "Add a check that verifies CLAUDE.md exists and has content"

**Actions:**
1. Add to `src/scoring/constants.ts`: `export const CLAUDE_MD_EXISTS_POINTS = 15;`
2. Create `src/scoring/checks/claude-md-exists.ts`:
   ```typescript
   import { Check } from '../index';
   import { CLAUDE_MD_EXISTS_POINTS } from '../constants';
   import { existsSync, readFileSync } from 'fs';
   import path from 'path';

   export function checkClaudeMdExists(dir: string): Check[] {
     const filePath = path.join(dir, 'CLAUDE.md');
     const passed = existsSync(filePath) && readFileSync(filePath, 'utf-8').trim().length > 0;
     return [{
       id: 'claude-md-exists',
       label: 'CLAUDE.md exists and has content',
       points: CLAUDE_MD_EXISTS_POINTS,
       passed,
       details: passed ? 'CLAUDE.md found with content.' : 'CLAUDE.md missing or empty.'
     }];
   }
   ```
3. Update `src/scoring/index.ts`:
   - Add: `import { checkClaudeMdExists } from './checks/claude-md-exists';`
   - In `runChecks()`: `checks.push(...checkClaudeMdExists(dir));`
4. Create test in `src/scoring/__tests__/claude-md-exists.test.ts`
5. Run: `npm run test -- src/scoring/checks`

**Result:** New check appears in `caliber score` output with 15 points on pass.

## Common Issues

**"Cannot find module 'src/scoring/checks/check-name'"**
- Verify file exists at exact path: `src/scoring/checks/<check-name>.ts`
- Verify import in `src/scoring/index.ts` uses correct filename
- Run: `ls -la src/scoring/checks/` to list files

**"Check returns undefined or null"**
- Check function must return an array `Check[]`, never `undefined`
- Always wrap return: `return [{ ... }];` even for single checks
- Verify `return` statement exists before the closing brace

**"Check undefined in scoring output"**
- Verify `checkName()` is called in `runChecks()` in `src/scoring/index.ts`
- Verify `checks.push(...checkName(dir));` is present
- Run: `npm run test -- src/scoring` to catch registration errors

**"Test fails: 'No such file or directory'"**
- Use `memfs` and `vol.fromJSON()` to mock filesystem; do NOT use real `fs`
- Example: `vol.fromJSON({ '/project/CLAUDE.md': 'content' });`
- Verify `beforeEach(() => vol.reset());` clears state between tests

**"Points value is wrong or missing"**
- Verify constant is defined in `src/scoring/constants.ts`: `export const CHECK_NAME_POINTS = <number>;`
- Verify import in check file: `import { CHECK_NAME_POINTS } from '../constants';`
- Verify check uses imported constant: `points: CHECK_NAME_POINTS,` not hardcoded number
- Run: `grep -n 'CHECK_NAME_POINTS' src/scoring/constants.ts src/scoring/checks/<check-name>.ts` to verify both exist