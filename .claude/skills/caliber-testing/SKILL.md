---
name: caliber-testing
description: Writes Vitest tests for caliber modules following project patterns. LLM calls are globally mocked via src/test/setup.ts; override per-test with vi.spyOn. Use temp dirs (os.tmpdir()) for learner/storage tests, mock fs via memfs for fingerprint tests. Use when user says 'write test', 'add test', 'test coverage', or creates files in src/**/__tests__/. Do NOT re-mock llmCall globally — it's already stubbed.
---
# Caliber Testing

## Critical

- **Global LLM mock already active**: `src/test/setup.ts` stubs `llmCall` and `llmJsonCall`. Do NOT re-mock globally. Override per-test only with `vi.spyOn(llmModule, 'llmCall').mockResolvedValue(...)`.
- **Test file location**: Place in `src/<module>/__tests__/<filename>.test.ts` matching the source structure (e.g., `src/learner/storage.ts` → `src/learner/__tests__/storage.test.ts`).
- **Import setup**: Always import `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'` and ensure `src/test/setup.ts` is loaded (happens automatically via Vitest config).
- **No process.exit in tests**: Wrap command execution in try/catch to avoid premature termination. Use `expect(() => { ... }).toThrow()` for error assertions.

## Instructions

1. **Determine test type and set up context**
   - For **learner/storage tests**: Import `os`, `path`, `fs/promises`. Create temp dir with `const tmpDir = path.join(os.tmpdir(), 'caliber-test-' + Date.now())` in `beforeEach`. Clean up in `afterEach` with `await fs.rm(tmpDir, { recursive: true, force: true })`.
   - For **fingerprint tests**: Import `memfs`, create virtual fs with `const { vol } = memfs()`. Inject via `vi.stubGlobal('fs', vol)` in setup.
   - For **AI module tests** (generate.ts, refine.ts): Mock `llmJsonCall` at the test level using `vi.spyOn(llmModule, 'llmJsonCall').mockResolvedValue({ ... })`.
   - For **command tests**: Import the command function from `src/commands/<name>.ts`. Mock `writeSetup`, telemetry, and fingerprint calls as needed.
   - **Verify**: Confirm the module under test has a clear interface and dependencies are mockable.

2. **Write describe block with meaningful suite name**
   - Use `describe('<module name> — <functionality>', () => { ... })`.
   - Example: `describe('learner storage — persist and load', () => { ... })`.
   - **Verify**: Block name reflects what is being tested, not generic "tests".

3. **Set up fixtures and mocks in beforeEach**
   - For **learner**: Initialize temp directory, create sample `.learner/` structure if needed.
   - For **fingerprint**: Set up virtual fs with realistic file tree using `vol.fromJSON({ '/path/file': 'content' })`.
   - For **AI**: Call `vi.spyOn(llmModule, 'llmJsonCall')` with a `.mockResolvedValue(mockResponse)` or `.mockRejectedValue(error)` for each test.
   - Mock common dependencies: `vi.mock('src/telemetry', () => ({ trackEvent: vi.fn() }))`.
   - **Verify**: All mocks and fixtures are isolated; no state leaks between tests.

4. **Write test cases using it() with descriptive names**
   - Test **happy path**: `it('should persist and load configuration', async () => { ... })`.
   - Test **error cases**: `it('should throw on corrupt JSON', async () => { ... })`.
   - Test **edge cases**: `it('should handle missing files gracefully', async () => { ... })`.
   - **Pattern**: `const result = await functionUnderTest(args); expect(result).toEqual(expected);`.
   - For **async operations**, always `await` and use `async () => { ... }` in it().
   - **Verify**: Each test is independent; passing or failing one does not affect others.

5. **Assert using expect() with clear matchers**
   - Use `expect(actual).toEqual(expected)` for objects, arrays.
   - Use `expect(fn).toHaveBeenCalledWith(args)` for function calls (on mocks).
   - Use `expect(() => { throwingCode() }).toThrow(ErrorClass)` for synchronous errors.
   - Use `expect(asyncFn()).rejects.toThrow(ErrorClass)` for async errors.
   - Use `expect(fs.existsSync(path)).toBe(true)` for file existence.
   - **Verify**: Assertions are specific (e.g., check both shape and values, not just truthiness).

6. **Clean up resources in afterEach**
   - For **temp dirs**: `await fs.rm(tmpDir, { recursive: true, force: true })`.
   - For **mocks**: `vi.restoreAllMocks()` (clears per-test overrides; global mocks persist).
   - For **virtual fs**: `vol.reset()` if using memfs.
   - **Verify**: No hanging processes, open files, or lingering state before next test.

## Examples

### Example 1: Learner Storage Test

**User says**: "Add test for learner storage persist method"

**File**: `src/learner/__tests__/storage.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { persistLearnings, loadLearnings } from '../storage';

describe('learner storage — persist and load', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), 'caliber-test-' + Date.now());
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should persist and load configuration', async () => {
    const data = { insights: 'test', metadata: { version: 1 } };
    await persistLearnings(tmpDir, data);
    const loaded = await loadLearnings(tmpDir);
    expect(loaded).toEqual(data);
  });

  it('should throw on corrupt JSON', async () => {
    const filePath = path.join(tmpDir, '.learner', 'data.json');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'not valid json');
    await expect(loadLearnings(tmpDir)).rejects.toThrow(SyntaxError);
  });
});
```

### Example 2: Fingerprint Code Analysis Test (with memfs)

**User says**: "Write test for fingerprint code analysis"

**File**: `src/fingerprint/__tests__/code-analysis.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { memfs } from 'memfs';
import { analyzeCode } from '../code-analysis';

describe('fingerprint code analysis — parse imports and patterns', () => {
  let vol: memfs.IVolume;

  beforeEach(() => {
    const { vol: volumeInstance } = memfs();
    vol = volumeInstance;
    vi.stubGlobal('fs', vol);
  });

  it('should detect TypeScript imports', async () => {
    vol.fromJSON({
      '/src/index.ts': 'import { foo } from "./bar";'
    });
    const result = await analyzeCode('/src/index.ts');
    expect(result.imports).toContain('./bar');
  });
});
```

### Example 3: AI Generate Module Test (with LLM mock)

**User says**: "Test the generate module AI prompt flow"

**File**: `src/ai/__tests__/generate.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as llmModule from '../../llm';
import { generateConfig } from '../generate';

describe('ai generate — CLAUDE.md creation', () => {
  beforeEach(() => {
    vi.spyOn(llmModule, 'llmJsonCall').mockResolvedValue({
      claudeMd: '# My Config',
      metadata: { model: 'claude-sonnet-4-6' }
    });
  });

  it('should call LLM with fingerprint and return config', async () => {
    const fingerprint = { framework: 'Node.js', language: 'TypeScript' };
    const result = await generateConfig(fingerprint);
    expect(llmModule.llmJsonCall).toHaveBeenCalledWith(
      expect.objectContaining({ model: expect.any(String) }),
      expect.any(String)
    );
    expect(result).toHaveProperty('claudeMd');
  });
});
```

## Common Issues

**Issue**: "TypeError: llmCall is not a function" or "llmJsonCall is not mocked"
- **Cause**: Test is trying to mock at import time, but global setup already applied.
- **Fix**: Use `vi.spyOn(llmModule, 'llmCall').mockResolvedValue(...)` in `beforeEach`, not in a top-level `vi.mock()` call. Ensure `import * as llmModule from 'src/llm'` is present.

**Issue**: "ENOENT: no such file or directory" in learner storage test
- **Cause**: Temp directory was not created, or path is incorrect.
- **Fix**: Call `await fs.mkdir(path.dirname(filePath), { recursive: true })` before writing. Verify tmpDir is created in `beforeEach`.

**Issue**: "Cannot find module 'memfs'" in fingerprint test
- **Cause**: memfs is listed in dependencies but virtual fs is not set up.
- **Fix**: Import `import { memfs } from 'memfs'` and call `const { vol } = memfs()` in `beforeEach`. Do NOT call `vi.stubGlobal('fs', vol)` until after vol is created.

**Issue**: "process.exit called during test, exiting with code 1"
- **Cause**: Command function calls `process.exit()` on error.
- **Fix**: Wrap command in try/catch and return error object. Or mock `process.exit` with `vi.spyOn(process, 'exit').mockImplementation(() => {})`. Always assert error state instead of relying on exit.

**Issue**: "Test timeout exceeded"
- **Cause**: Async operation hanging (e.g., fs.rm not completing, mock not resolving).
- **Fix**: Add explicit `await` before all async calls. Use `vi.useFakeTimers()` if testing timers. Increase timeout with `it('name', async () => {...}, 10000)` only after confirming no true hangs.