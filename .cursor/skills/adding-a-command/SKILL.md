---
name: adding-a-command
description: Creates a new CLI command following caliber's pattern: file in src/commands/, named export async function, register in src/cli.ts with tracked(), use ora spinners for UX, throw __exit__ on user-facing failures, return structured results. Use when user says 'add command', 'new subcommand', 'create CLI action', or adds files to src/commands/. Do NOT use for modifying existing commands or adding flags to existing ones.
---
# Adding a Command

## Critical

1. **Always register in `src/cli.ts`** — Commands not registered won't execute. Registration wraps commands with `tracked()` for telemetry and binds arguments.
2. **Throw `__exit__` for user-facing errors** — Never use `process.exit()` directly. Use the `__exit__` error class to signal controlled failure with a message printed to stderr.
3. **Use named async exports** — Each command in `src/commands/` must be `export async function commandName(...)` to match Commander.js argument binding.
4. **Return structured results** — Commands must return an object matching the command's result type (or void). This enables chaining, testing, and logging.

## Instructions

1. **Create command file in `src/commands/{name}.ts`**
   - Use PascalCase for internal function names, kebab-case for CLI command name.
   - Example: command `caliber foo-bar` → `src/commands/fooBar.ts` with `export async function fooBar(...)`
   - Import `__exit__` from `src/lib/state.ts` and `ora` from `ora`.
   - Verify file follows existing pattern in `src/commands/init.ts` or `src/commands/score.ts`.

2. **Define typed parameters and return type**
   - Add parameter interface to `src/commands/types.ts` (or inline in file if simple).
   - Example:
     ```typescript
     export interface FooBarOptions {
       verbose?: boolean;
       output?: string;
     }
     export interface FooBarResult {
       message: string;
       count: number;
     }
     ```
   - Verify type exports are accessible from `src/cli.ts`.

3. **Implement command with spinner + error handling**
   - Wrap long operations in `const spinner = ora('Doing thing...').start()`.
   - Call `spinner.succeed('Done')` or `spinner.fail('Failed')` based on outcome.
   - Use try/catch for synchronous errors; wrap async calls in try/catch.
   - For user-facing errors, throw `new __exit__('User message')` — do NOT use `throw new Error()`.
   - Example:
     ```typescript
     export async function fooBar(opts: FooBarOptions): Promise<FooBarResult> {
       const spinner = ora('Processing...').start();
       try {
         const result = await someAsyncCall();
         spinner.succeed(`Processed ${result.count} items`);
         return { message: 'Done', count: result.count };
       } catch (err) {
         if (err instanceof SomeKnownError) {
           spinner.fail(err.message);
           throw new __exit__(err.message);
         }
         throw err; // Let tracked() in cli.ts handle unknown errors
       }
     }
     ```
   - Verify spinner states are used before returning or throwing.

4. **Register command in `src/cli.ts`**
   - Import the command: `import { fooBar } from './commands/fooBar'`.
   - Add to program definition using `.command()` and `.action(tracked())` pattern:
     ```typescript
     program
       .command('foo-bar')
       .description('Do foo bar operations')
       .option('--verbose', 'Verbose output', false)
       .option('--output <path>', 'Output file', './output')
       .action(tracked(async (opts) => {
         return await fooBar(opts);
       }));
     ```
   - Ensure `.option()` names match interface properties (camelCase in interface, convert from kebab-case in CLI).
   - Verify command appears in `--help` output after registration.

5. **Add tests in `src/commands/__tests__/{name}.test.ts`**
   - Import `describe`, `it`, `expect` from `vitest`.
   - Mock dependencies using `vi.mock()`.
   - Test success path and all error branches (throw `__exit__`, throw unknown error).
   - Example:
     ```typescript
     import { describe, it, expect, vi } from 'vitest';
     import { fooBar } from '../fooBar';
     it('should return result on success', async () => {
       const result = await fooBar({ verbose: true });
       expect(result.count).toBeGreaterThan(0);
     });
     it('should throw __exit__ on user error', async () => {
       await expect(fooBar({ output: '/invalid' })).rejects.toThrow('__exit__');
     });
     ```
   - Verify tests pass: `npm run test -- fooBar`.

## Examples

**User says:** "Add a command that validates all project configs and scores them."

**Actions taken:**
1. Create `src/commands/validate.ts`:
   ```typescript
   import { __exit__ } from '../lib/state';
   import ora from 'ora';
   
   export interface ValidateOptions {
     fix?: boolean;
   }
   
   export interface ValidateResult {
     valid: boolean;
     issues: string[];
   }
   
   export async function validate(opts: ValidateOptions): Promise<ValidateResult> {
     const spinner = ora('Validating configs...').start();
     try {
       const issues: string[] = [];
       // validation logic
       if (issues.length > 0) {
         spinner.warn(`Found ${issues.length} issues`);
         if (!opts.fix) throw new __exit__('Fix issues or use --fix');
       } else {
         spinner.succeed('All configs valid');
       }
       return { valid: issues.length === 0, issues };
     } catch (err) {
       if (err instanceof __exit__) throw err;
       spinner.fail('Validation error');
       throw err;
     }
   }
   ```
2. Register in `src/cli.ts`:
   ```typescript
   program
     .command('validate')
     .description('Validate all configs')
     .option('--fix', 'Auto-fix issues')
     .action(tracked(async (opts) => await validate(opts)));
   ```
3. Create `src/commands/__tests__/validate.test.ts` with success and error cases.
4. Run `npm run test` and `npm run build` to verify.

## Common Issues

**Issue:** Command not appearing in CLI help or not executing.
- **Cause:** Missing or incorrect registration in `src/cli.ts`.
- **Fix:** Verify import statement is present and `.action(tracked(async (opts) =>` pattern is used. Run `npx caliber --help` to confirm command appears.

**Issue:** Error is swallowed or shows stack trace instead of user message.
- **Cause:** Throwing `new Error()` instead of `new __exit__()`.
- **Fix:** Replace all user-facing error throws with `throw new __exit__('message')`. Unknown errors should propagate (not caught) for `tracked()` to handle telemetry.

**Issue:** Spinner never stops or shows wrong state.
- **Cause:** Missing `.succeed()`, `.fail()`, or `.warn()` call before return/throw.
- **Fix:** Always call `spinner.succeed()` on success, `spinner.fail()` or `spinner.warn()` before throwing `__exit__`. Do not call `.stop()` manually — use the state methods.

**Issue:** TypeScript error: Property 'X' does not exist on options.
- **Cause:** Interface property name (camelCase) doesn't match Commander.js option binding.
- **Fix:** Verify `.option('--kebab-name', ...)` converts to camelCase in interface: `kebabName: boolean`. Run `npx tsc --noEmit` to catch mismatches.

**Issue:** Build fails with "Cannot find module 'src/commands/newCommand'".
- **Cause:** File created but not yet imported in `src/cli.ts`.
- **Fix:** Add `import { newCommand } from './commands/newCommand'` at top of `src/cli.ts` before using in `.action()`.