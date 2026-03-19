---
name: llm-provider
description: Implements or modifies an LLM provider in src/llm/ implementing LLMProvider interface (call()+stream()) from src/llm/types.ts. All calls route through src/llm/index.ts. Use when user says 'add provider', 'new LLM', 'support model X', 'integrate API'. Do NOT call providers directly from commands—always route through llmCall() or llmJsonCall(). Do NOT add new provider types without updating src/llm/index.ts provider resolution logic.
---
# LLM Provider

## Critical

- **All LLM calls from commands MUST use `llmCall()` or `llmJsonCall()` from `src/llm/index.ts`**. Never instantiate or call a provider directly.
- **Every provider MUST implement `LLMProvider` interface** from `src/llm/types.ts`: `call(params: LLMCallParams): Promise<string>` and `stream(params: LLMStreamParams): AsyncIterable<string>`.
- **Provider detection logic lives in `src/llm/config.ts`** (`getProvider()` function). If adding a new provider, update the detection chain BEFORE adding the provider file.
- **Error handling**: All providers MUST detect transient errors (rate limits, timeouts, 502/503) and throw `TransientError` so callers can retry. Reference `src/llm/model-recovery.ts` and `TRANSIENT_ERRORS` in `src/llm/index.ts`.
- **Token estimation**: Use `estimateTokens()` from `src/llm/utils.ts` to pre-check request size and avoid oversized requests.

## Instructions

1. **Verify provider interface in `src/llm/types.ts`**
   - Confirm `LLMProvider` has `call(params: LLMCallParams): Promise<string>` and `stream(params: LLMStreamParams): AsyncIterable<string>`.
   - Check that `LLMCallParams` and `LLMStreamParams` match your API's model, temperature, max_tokens, system, messages.
   - Validation: `npx tsc --noEmit` should pass before proceeding.

2. **Create provider file at `src/llm/{provider-name}.ts`**
   - Follow naming: `anthropic.ts`, `openai-compat.ts`, `vertex.ts` (kebab-case, no dots before extension).
   - Export a class: `export class {ProviderName}LLMProvider implements LLMProvider { ... }`.
   - Add constructor to accept config (API key, project ID, endpoint) from environment or passed argument.
   - Validation: File must compile with `npx tsc --noEmit` before next step.

3. **Implement `call()` method**
   - Accept `params: LLMCallParams` (model, system, messages, temperature, max_tokens).
   - Make HTTP/SDK request to provider (Anthropic SDK, OpenAI SDK, REST, etc.).
   - Return `string` (the assistant's text response).
   - On error: throw `TransientError` for rate limits (429), timeouts, 502/503; throw `Error` for auth/model/bad request.
   - Wrap in try/catch; log errors via `console.error()` before throwing.
   - Validation: Test with `npm run test` against mocked provider responses.

4. **Implement `stream()` method**
   - Accept `params: LLMStreamParams` (same fields as call()).
   - Yield `string` chunks as they arrive (no buffering whole response).
   - Return `AsyncIterable<string>` (use `async function*`).
   - On error: catch and yield error message or throw `TransientError` before yielding any chunk.
   - Validation: Verify stream completes without deadlock using `src/test/` helpers or manual test.

5. **Update provider detection in `src/llm/config.ts`**
   - Open `getProvider()` function (typically returns provider instance based on env vars).
   - Add conditional: `if (process.env.{YOUR_KEY}) { return new {ProviderName}LLMProvider(...) }`.
   - Order matters: check most specific (e.g., VERTEX_PROJECT_ID) before generic (e.g., OPENAI_API_KEY).
   - Validation: Run `caliber init` in test project; verify provider is auto-detected.

6. **Export provider from `src/llm/index.ts`**
   - Add import: `import { {ProviderName}LLMProvider } from './{provider-name}'`.
   - Ensure `llmCall()` and `llmJsonCall()` use the result of `getProvider()` (already hooked up; verify no changes needed).
   - Validation: `npm run test` passes; no unused imports.

7. **Add tests in `src/llm/__tests__/{provider-name}.test.ts`**
   - Test `call()` with mocked responses (use `vi.mock()` or `memfs` for file-based mocks).
   - Test `stream()` yielding chunks, completing without error.
   - Test error cases: 429 throws `TransientError`, 401 throws `Error`.
   - Validation: `npm run test:coverage` — aim for >80% coverage on provider file.

## Examples

**User says:** "Add support for Claude models via a custom endpoint."

**Actions:**
1. Check `src/llm/types.ts` confirms `LLMProvider` interface.
2. Create `src/llm/custom-claude.ts`:
   ```typescript
   import { LLMProvider, LLMCallParams, LLMStreamParams } from './types';
   import { TransientError } from './model-recovery';
   
   export class CustomClaudeLLMProvider implements LLMProvider {
     constructor(private endpoint: string, private apiKey: string) {}
   
     async call(params: LLMCallParams): Promise<string> {
       try {
         const res = await fetch(`${this.endpoint}/messages`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${this.apiKey}` },
           body: JSON.stringify({
             model: params.model,
             system: params.system,
             messages: params.messages,
             temperature: params.temperature,
             max_tokens: params.max_tokens,
           }),
         });
         if (res.status === 429 || res.status === 502 || res.status === 503) throw new TransientError(`${res.status}`);
         if (!res.ok) throw new Error(`HTTP ${res.status}`);
         const data = await res.json();
         return data.content[0].text;
       } catch (e) {
         if (e instanceof TransientError) throw e;
         throw new Error(`CustomClaude call failed: ${e}`);
       }
     }
   
     async *stream(params: LLMStreamParams): AsyncIterable<string> {
       // Similar to call() but with stream endpoint and yield chunks.
     }
   }
   ```
3. Update `src/llm/config.ts`:
   ```typescript
   if (process.env.CUSTOM_CLAUDE_ENDPOINT && process.env.CUSTOM_CLAUDE_API_KEY) {
     return new CustomClaudeLLMProvider(
       process.env.CUSTOM_CLAUDE_ENDPOINT,
       process.env.CUSTOM_CLAUDE_API_KEY
     );
   }
   ```
4. Export in `src/llm/index.ts`.
5. Add test file `src/llm/__tests__/custom-claude.test.ts` with mocked fetch.
6. Run `npm run test` and verify.

**Result:** Commands like `caliber init` now detect and use the custom endpoint without modification.

## Common Issues

- **Error: "Provider not detected when env var is set"**
  - Check `src/llm/config.ts` — is your env var check above other fallbacks? Move it higher in the `if` chain.
  - Verify env var name matches exactly: `echo $CUSTOM_CLAUDE_ENDPOINT`.
  - Confirm provider is exported in `src/llm/index.ts`.

- **Error: "Cannot find module 'src/llm/{provider-name}'"**
  - Verify file path is `src/llm/{provider-name}.ts` (not `.js`, not in subdirectory).
  - Run `npm run build` to compile TypeScript to dist/; check dist/ has the file.

- **Error: "Transient errors not retried, request fails immediately"**
  - Verify you throw `TransientError` (not `Error`) for 429, 502, 503, timeouts.
  - Check `src/llm/index.ts` `llmCall()` has retry logic (already present; ensure no overrides).
  - Test: `npm run test -- src/llm/__tests__/{provider-name}.test.ts`.

- **Error: "Stream method times out or yields nothing"**
  - Ensure `stream()` returns `AsyncIterable<string>` and uses `async function*`.
  - Never buffer the entire response; yield chunks as they arrive.
  - Add timeout to stream read loop: `setTimeout(() => throw new Error('timeout'), 30000)`.
  - Test with `npm run test:watch` and add `console.log()` in stream yields to debug.