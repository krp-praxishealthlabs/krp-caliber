---
name: caliber-testing
description: Writes Vitest tests for caliber modules following project patterns. LLM calls globally mocked via src/test/setup.ts; override per-test with vi.spyOn. Use temp dirs (os.tmpdir()) for learner/storage tests, memfs for fingerprint tests. Use when user says 'write test', 'add test', 'test coverage', 'unit test'. Do NOT re-mock llmCall globally or use localStorage-like APIs directly.
---
# Caliber Testing

## Critical

- **Global LLM mock already active**: All tests inherit `vi.mock()` from `src/test/setup.ts`. Do NOT re-mock `src/llm/index.ts` or `llmCall`. Override specific test behavior with `vi.spyOn(llmModule, 'llmCall').mockResolvedValueOnce({...})`.
- **Imports matter**: Always import test utilities from `src/test/setup.ts` or `vitest`. Import the module under test with correct path (e.g., `import { scanLocalState } from '../scanner'`).
- **Temp directories for I/O**: Use `os.tmpdir()` + `fs.mkdtempSync()` for learner/storage tests. Clean up with `fs.rmSync(dir, { recursive: true })`.
- **memfs for file-tree**: Fingerprint file-tree tests use `memfs` virtual filesystem (`import { vol } from 'memfs'`). Initialize with `vol.fromJSON({...})` before each test.
- **Type safety**: All test code must be TypeScript. Use exact return types from `src/**/*.ts` (e.g., `ConfigState`, `ScanResult`, `ErrorResponse`).

## Instructions

1. **Create test file in same directory structure as source**
   - Source: `src/fingerprint/git.ts` → Test: `src/fingerprint/__tests__/git.test.ts`
   - Source: `src/commands/init.ts` → Test: `src/commands/__tests__/init.test.ts`
   - Verify no test file already exists before creating.

2. **Import test setup and dependencies**
   ```typescript
   import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
   import { llmCall, llmJsonCall } from '../../llm';
   // Global mock from src/test/setup.ts handles llmCall already
   ```
   - For learner tests: `import * as os from 'os'; import * as fs from 'fs'`.
   - For fingerprint file-tree tests: `import { vol } from 'memfs'`.
   - Verify imports resolve without circular dependencies.

3. **Set up beforeEach/afterEach lifecycle**
   - **For temp dir tests**: `beforeEach(() => { testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caliber-test-')); })` and `afterEach(() => { fs.rmSync(testDir, { recursive: true }); })`.
   - **For memfs tests**: `beforeEach(() => { vol.reset(); vol.fromJSON({...}); })` and `afterEach(() => { vol.reset(); })`.
   - **For CLI/command tests**: Call `vi.clearAllMocks()` in `afterEach`.
   - Verify cleanup executes even if test fails.

4. **Write test case matching existing test patterns**
   - Reference `src/**/__tests__/*.test.ts` for style.
   - Test structure: `it('should [behavior] when [condition]', async () => { ... })`.
   - Assert on return values and side effects (file writes, LLM calls).
   - If testing LLM integration: `expect(llmCall).toHaveBeenCalledWith(expect.objectContaining({...}))`.
   - Verify test is deterministic (no random delays, use `vi.useFakeTimers()` if needed).

5. **Mock LLM responses per-test only**
   ```typescript
   vi.spyOn(llmModule, 'llmCall').mockResolvedValueOnce({
     content: [{type: 'text', text: JSON.stringify({...})}],
     usage: {input_tokens: 100, output_tokens: 50}
   });
   ```
   - Return object matching `LLMResponse` type from `src/llm/types.ts`.
   - Restore with `vi.restoreAllMocks()` in `afterEach` or use `mockResolvedValueOnce` (auto-restores).
   - Verify mock is called exactly once unless test requires multiple calls.

6. **For learner/storage tests**: Use temp directories and real filesystem
   - Write test data via `fs.writeFileSync(path.join(testDir, 'file.json'), JSON.stringify(data))`.
   - Read and assert: `const result = JSON.parse(fs.readFileSync(path.join(testDir, 'file.json'), 'utf-8'))`.
   - Verify test data persists and is cleaned up after test.

7. **Run test and verify coverage**
   - Execute: `pnpm test -- --run src/**/__tests__/your-test.test.ts`.
   - Check coverage: `pnpm test:coverage` (v8 reporter).
   - Verify all happy-path and error-path branches covered (aim for >80% for new tests).
   - If test fails, check setup.ts is loaded and llmCall is mocked.

## Examples

**User**: "Write a test for `src/learner/storage.ts` `saveState()` function."

**Actions**:
1. Create `src/learner/__tests__/storage.test.ts`.
2. Import `{ saveState, loadState }` from `../storage` and setup utils.
3. In `beforeEach`: `testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caliber-test-'))`.
4. Write test:
   ```typescript
   it('should save state to file', async () => {
     const state = { version: 1, data: { key: 'value' } };
     const filePath = path.join(testDir, 'state.json');
     await saveState(filePath, state);
     const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
     expect(loaded).toEqual(state);
   });
   ```
5. In `afterEach`: `fs.rmSync(testDir, { recursive: true })`.
6. Run: `pnpm test -- --run src/learner/__tests__/storage.test.ts`.

**Result**: Test passes, file cleaned up, coverage +3%.

---

**User**: "Add a test for fingerprint `fileTree()` with different directory structures."

**Actions**:
1. Create `src/fingerprint/__tests__/file-tree.test.ts`.
2. Import `{ fileTree }` and `{ vol }` from `memfs`.
3. In `beforeEach`: `vol.fromJSON({ '/project/src/index.ts': 'export {}', '/project/package.json': '{}' })`.
4. Write test:
   ```typescript
   it('should return nested tree structure', async () => {
     const tree = await fileTree('/project', { exclude: ['node_modules'] });
     expect(tree.children).toHaveLength(2);
     expect(tree.children?.some(n => n.name === 'src')).toBe(true);
   });
   ```
5. Run: `pnpm test -- --run src/fingerprint/__tests__/file-tree.test.ts`.

**Result**: Test passes with memfs-backed virtual filesystem, no I/O side effects.

## Common Issues

- **"Cannot find module 'src/test/setup'"** → Verify `src/test/setup.ts` exists and exports test utilities. Check path is relative (e.g., `import { llmCall } from '../../llm'` from `src/commands/__tests__/`).
- **"llmCall is not mocked" or test calls real API** → Global mock in `setup.ts` may not be loaded. Add `vi.mock('../../llm')` at top of test file OR verify test runs after setup loads. Check vitest config includes `setupFiles: ['src/test/setup.ts']`.
- **Test hangs or times out** → Likely async/await missing. Ensure test function is `async` and all promises are `await`ed. Use `vi.useFakeTimers()` for setTimeout tests.
- **memfs vol.reset() doesn't clear filesystem** → Call `vol.reset()` in `beforeEach` BEFORE `vol.fromJSON()`. Verify no other test modifies vol concurrently.
- **Temp directory not cleaned up (test pollutes filesystem)** → Missing `fs.rmSync(testDir, { recursive: true })` in `afterEach`. Wrap in try-finally if needed.
- **"Cannot destructure llmCall from mocked module"** → Global mock returns object with `llmCall` property. Import as `import * as llmModule from '../../llm'` then use `llmModule.llmCall`.
- **Type errors on mock return** → Verify return shape matches `LLMResponse` type: `{ content: Array<{type: string, text: string}>, usage: {input_tokens: number, output_tokens: number} }`.