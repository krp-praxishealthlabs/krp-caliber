---
name: fingerprint-pipeline
description: Extends or modifies the project fingerprinting pipeline in src/fingerprint/. Covers collectFingerprint() in index.ts, file-tree.ts (getFileTree), code-analysis.ts, existing-config.ts (readExistingConfigs), and cache.ts (loadFingerprintCache/saveFingerprintCache). Use when user says 'add fingerprint data', 'detect X in projects', 'read existing config', or modifies src/fingerprint/. Do NOT use for LLM-based stack detection — that lives in src/ai/detect.ts.
---
# Fingerprint Pipeline

## Critical

- **All fingerprint functions must be pure or side-effect-free** — cache is handled separately in `cache.ts`. Don't write to disk inside fingerprint functions.
- **Hash must be recomputed deterministically** — `computeFingerprintHash()` in `src/fingerprint/index.ts` uses `JSON.stringify()` on the fingerprint object. Any new field must appear in the hash calculation.
- **Cache invalidation**: If you add a new fingerprint field, bump the `FINGERPRINT_VERSION` constant in `src/fingerprint/cache.ts` to force recalculation.
- **Type definitions in `src/fingerprint/types.ts`** — all fingerprint shapes must be typed. Export the type and use it in function signatures.

## Instructions

### 1. Define or extend the Fingerprint type in `src/fingerprint/types.ts`

```typescript
export interface Fingerprint {
  // existing fields...
  myNewField?: string[];
}
```

**Verify**: Type compiles and is imported in `src/fingerprint/index.ts`.

### 2. Implement collection logic in the appropriate module

Choose the right file based on data source:
- **`file-tree.ts`**: File/directory structure → `getFileTree(root: string): Promise<FileTree>`
- **`code-analysis.ts`**: Static code patterns → implement as `async analyzeCode(paths: string[]): Promise<CodeMetrics>`
- **`existing-config.ts`**: Read CLAUDE.md/.cursor/rules/ → `readExistingConfigs(root: string): Promise<ExistingConfig>`
- **`git.ts`**: Git metadata → add to `collectGitInfo(root: string): Promise<GitInfo>`

Follow the existing async pattern. Use `glob()` from `glob` package for file matching (already imported).

**Example** (in `code-analysis.ts`):
```typescript
export async function analyzeCode(root: string): Promise<CodeMetrics> {
  const files = await glob('**/*.ts', { cwd: root, ignore: ['node_modules', 'dist'] });
  return { tsFileCount: files.length };
}
```

**Verify**: Function signature matches its import site in `src/fingerprint/index.ts`.

### 3. Integrate into `collectFingerprint()` in `src/fingerprint/index.ts`

Add your function call to the main pipeline:
```typescript
export async function collectFingerprint(root: string): Promise<Fingerprint> {
  const [gitInfo, fileTree, codeMetrics, existingConfigs] = await Promise.all([
    collectGitInfo(root),
    getFileTree(root),
    analyzeCode(root),  // ← new call
    readExistingConfigs(root),
  ]);
  
  return {
    gitInfo,
    fileTree,
    codeMetrics,
    existingConfigs,
    // myNewField: ...derived data
  };
}
```

**Verify**: All Promise.all() calls resolve and type-check.

### 4. Update `computeFingerprintHash()` to include the new field

In `src/fingerprint/index.ts`:
```typescript
export function computeFingerprintHash(fp: Fingerprint): string {
  // Ensure all fields that affect behavior are included
  const canonical = {
    gitSha: fp.gitInfo.sha,
    files: Object.keys(fp.fileTree).sort(),
    myNewField: fp.myNewField,  // ← add here
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
```

**Verify**: Hash changes when the new field changes.

### 5. Bump `FINGERPRINT_VERSION` in `src/fingerprint/cache.ts`

```typescript
const FINGERPRINT_VERSION = 2; // was 1, now 2
```

This forces `loadFingerprintCache()` to treat old caches as stale.

**Verify**: Test that cached fingerprints are invalidated: `npm run test -- src/fingerprint/__tests__/cache.test.ts`.

### 6. Write tests in `src/fingerprint/__tests__/`

Create or extend a test file matching your module:
- `code-analysis.test.ts` for code-analysis logic
- `existing-config.test.ts` for config detection
- etc.

Use `describe()`, `it()`, and mock `glob()` with `vi.mock('glob')`.

**Example**:
```typescript
it('should count TypeScript files', async () => {
  const metrics = await analyzeCode(testRoot);
  expect(metrics.tsFileCount).toBe(3);
});
```

**Verify**: `npm run test -- src/fingerprint/__tests__/my-module.test.ts` passes.

## Examples

**User says**: "Detect the Node version from .nvmrc or package.json"

**Actions**:
1. Add `nodeVersion?: string` to `Fingerprint` interface in `types.ts`.
2. Implement `detectNodeVersion(root: string)` in `code-analysis.ts`:
   ```typescript
   export async function detectNodeVersion(root: string): Promise<string | undefined> {
     const nvmrc = await readFile(join(root, '.nvmrc'), 'utf8').catch(() => null);
     if (nvmrc) return nvmrc.trim().split('\n')[0];
     const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
     return pkg.engines?.node;
   }
   ```
3. Add to `collectFingerprint()`: `codeMetrics.nodeVersion = await detectNodeVersion(root);`
4. Add to `computeFingerprintHash()` canonical object: `nodeVersion: fp.codeMetrics?.nodeVersion`.
5. Bump `FINGERPRINT_VERSION` in `cache.ts`.
6. Write test in `code-analysis.test.ts`.

**Result**: Fingerprint now includes Node version, cached appropriately, and hash updates when version changes.

## Common Issues

**"Cannot find module 'src/fingerprint/types'"**
- Ensure `types.ts` exists and exports the type. Check the import path in `index.ts` matches your file location.

**"Hash mismatch: cached fingerprint is stale"**
- You likely added a new field but forgot to bump `FINGERPRINT_VERSION` in `cache.ts`. Increment it by 1.
- Or, the field is missing from `computeFingerprintHash()` canonical object. Add it and re-bump the version.

**"Fingerprint collection times out"**
- Check `glob()` patterns — they may be too broad (e.g., globbing `**/*` without ignoring `node_modules`). Use `{ ignore: ['node_modules', 'dist', '.git'] }` in all glob calls.
- Use `Promise.all()` for independent operations; avoid nested awaits.

**"Type 'Fingerprint' does not have property 'myNewField'"**
- Update `src/fingerprint/types.ts` to include the field in the interface. Mark optional fields with `?:`.

**Tests fail with "glob is not a function"**
- Mock is not set up. In test file, add:
  ```typescript
  vi.mock('glob');
  ```
  Then use `vi.mocked(glob).mockResolvedValue([...])` to set return values.