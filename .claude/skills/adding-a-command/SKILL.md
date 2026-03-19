---
name: adding-a-command
description: Creates a new CLI command following caliber's pattern: file in src/commands/, named export async function, register in src/cli.ts with tracked(), use ora spinners, throw __exit__ on user-facing failures. Use when user says 'add command', 'new subcommand', 'create CLI action', or adds files to src/commands/. Do NOT use for modifying existing commands or fixing bugs in existing command logic.
---
# Adding a Command

## Critical

1. **Command file MUST be in `src/commands/`** with named export: `export async function commandName(options: Options): Promise<void>`
2. **Register in `src/cli.ts`** using `.action(tracked('command-name', commandName))` to enable telemetry
3. **User-facing errors MUST throw `__exit__`** — never console.error or process.exit directly
4. **Always use `ora` spinners** for async operations; call `.stop()` before throwing or returning
5. **Return type is always `Promise<void>`** — no return values, side effects only

## Instructions

1. **Create the command file**
   - Path: `src/commands/your-command-name.ts`
   - Import: `import { __exit__ } from '../lib/exit'` and `import ora from 'ora'`
   - Define:
     ```typescript
     export interface YourCommandOptions {
       // Add any CLI flags here
     }

     export async function yourCommandName(options: YourCommandOptions): Promise<void> {
       const spinner = ora('Processing...').start();
       try {
         // your logic
         spinner.succeed('Done');
       } catch (error) {
         spinner.stop();
         throw __exit__(error instanceof Error ? error.message : String(error));
       }
     }
     ```
   - Verify: File exists and exports the function; no direct process.exit or console.error calls

2. **Register command in `src/cli.ts`**
   - Import at top: `import { yourCommandName } from './commands/your-command-name'`
   - Add Commander subcommand (matching existing pattern from `init`, `score`, `refresh`, etc.):
     ```typescript
     program
       .command('your-command')
       .description('What this command does')
       .option('--flag <value>', 'Flag description')
       .action(tracked('your-command', yourCommandName));
     ```
   - Verify: Command appears in `caliber --help`; no TypeScript errors

3. **Add unit tests** (optional but recommended)
   - Path: `src/commands/__tests__/your-command-name.test.ts`
   - Use Vitest; mock `ora` spinner and `__exit__`
   - Run: `npm run test -- your-command-name`
   - Verify: Tests pass; coverage > 80%

4. **Export from `src/commands/index.ts`** if re-exported (check if file exists)
   - Add: `export { yourCommandName } from './your-command-name'`
   - Verify: No circular imports; `npx tsc --noEmit` passes

## Examples

**User says:** "Add a `caliber lint` command that validates CLAUDE.md files."

**Actions:**
1. Create `src/commands/lint.ts`:
   ```typescript
   import { __exit__ } from '../lib/exit';
   import ora from 'ora';
   import { globSync } from 'glob';

   export interface LintOptions {
     fix?: boolean;
   }

   export async function lint(options: LintOptions): Promise<void> {
     const spinner = ora('Linting CLAUDE.md files...').start();
     try {
       const files = globSync('**/CLAUDE.md');
       if (files.length === 0) throw new Error('No CLAUDE.md files found');
       spinner.succeed(`Linted ${files.length} file(s)`);
     } catch (error) {
       spinner.stop();
       throw __exit__(error instanceof Error ? error.message : String(error));
     }
   }
   ```

2. Register in `src/cli.ts`:
   ```typescript
   import { lint } from './commands/lint';

   program
     .command('lint')
     .description('Validate CLAUDE.md files')
     .option('--fix', 'Auto-fix issues')
     .action(tracked('lint', lint));
   ```

3. Run: `npm run build && npx caliber lint` — spinners display, no errors throw __exit__

## Common Issues

**Error: "Cannot find module '__exit__'"**
- Fix: Verify `src/lib/exit.ts` exists. If missing, create: `export const __exit__ = (msg: string) => new Error(msg);`
- Or import from existing pattern: check `src/commands/init.ts` for the correct path

**Error: "[ERR_REQUIRE_ESM]" when running command**
- Fix: Ensure `src/cli.ts` uses `.action(tracked(...))` NOT `.action(async (options) => ...)` — tracked() wraps the async function
- Verify import: `import { tracked } from '../telemetry'` exists

**Spinner hangs or "unhandled rejection" after command**
- Fix: Always call `spinner.stop()` or `spinner.succeed()` before throwing. If async operation fails, stop spinner FIRST: `spinner.stop(); throw __exit__(...)`
- Verify: No await without try/catch; all promises resolved before function returns

**TypeScript error: "Promise<void> is not assignable to void"**
- Fix: Command function signature MUST be `async function (...): Promise<void>`. Remove any implicit returns (e.g., `return Promise.resolve()` → just let it return naturally)

**Command not appearing in `caliber --help`**
- Fix: Verify in `src/cli.ts`: (1) import statement added, (2) `.command('name')` matches intended subcommand, (3) `.action(tracked(...))` wraps the function
- Run: `npm run build` then `npx caliber --help`