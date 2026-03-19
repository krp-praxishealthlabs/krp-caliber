---
name: llm-provider
description: Implements or modifies an LLM provider in src/llm/ by implementing the LLMProvider interface (call() + stream() methods). All provider calls route through src/llm/index.ts (llmCall, llmJsonCall). Use when user says 'add provider', 'new LLM', 'support model X', or modifies src/llm/ files. Do NOT use for calling LLM from commands—use existing llmCall/llmJsonCall instead.
---
# LLM Provider Implementation

## Critical

- **All providers MUST implement `LLMProvider` interface** from `src/llm/types.ts`: `call(params: LLMCallParams): Promise<string>` and `stream(params: LLMCallParams): AsyncGenerator<string>`.
- **Provider registration happens in `src/llm/index.ts`**: Add provider instance to `llmCall()` and `llmJsonCall()` switch statement.
- **Error handling is mandatory**: Wrap API calls in try/catch. Transient errors (timeout, rate limit, network) must be in `TRANSIENT_ERRORS` set in `src/llm/index.ts` for retry logic. Seat-based errors detected via `parseSeatBasedError()` from `src/llm/seat-based-errors.ts`.
- **Token estimation required**: Implement `estimateTokens()` helper in provider file; export for usage tracking in `src/llm/usage.ts`.
- **No direct provider instantiation in commands**: All LLM calls go through `llmCall()` or `llmJsonCall()` in `src/llm/index.ts`—commands never import provider classes directly.

## Instructions

1. **Create provider file in `src/llm/`** (e.g., `src/llm/my-provider.ts`).
   - Import `LLMProvider`, `LLMCallParams`, `LLMResponse` from `src/llm/types.ts`.
   - Import `estimateTokens` utility function (see Step 3).
   - Verify: File exists and TypeScript compiles via `npx tsc --noEmit`.

2. **Implement `LLMProvider` interface** with two methods:
   ```typescript
   export class MyProvider implements LLMProvider {
     async call(params: LLMCallParams): Promise<string> {
       try {
         // API call logic here
         // Return full response text
       } catch (error) {
         throw new Error(`MyProvider error: ${error.message}`);
       }
     }
     async *stream(params: LLMCallParams): AsyncGenerator<string> {
       try {
         // Streaming logic: yield chunks as they arrive
       } catch (error) {
         throw new Error(`MyProvider stream error: ${error.message}`);
       }
     }
   }
   ```
   - Verify: Both methods accept `LLMCallParams` (model, messages, temperature, maxTokens, system).

3. **Export `estimateTokens()` function** in provider file:
   ```typescript
   export function estimateTokensMyProvider(messages: Message[]): number {
     // Rough estimate: 1 token ≈ 4 chars
     return Math.ceil(JSON.stringify(messages).length / 4);
   }
   ```
   - Verify: Function signature matches `(messages: Message[]) => number`.

4. **Update `src/llm/index.ts`**:
   - Import provider class and `estimateTokens` function: `import { MyProvider, estimateTokensMyProvider } from './my-provider'`.
   - Create instance: `const myProvider = new MyProvider()`.
   - Add to `llmCall()` switch: `case 'my-provider': return myProvider.call(params)`.
   - Add to `llmJsonCall()` switch: `case 'my-provider': return myProvider.stream(params)`.
   - Add model to `TRANSIENT_ERRORS` if provider has transient errors: `TRANSIENT_ERRORS.add('my-model-name')`.
   - Verify: `npm run build` succeeds without type errors.

5. **Handle provider-specific errors** in `src/llm/seat-based-errors.ts`:
   - If provider has seat-based or quota errors, add detection logic to `parseSeatBasedError(error, model)`.
   - Example: Check `error.code === 'RATE_LIMIT_EXCEEDED'` for your provider.
   - Verify: Run `npm run test` — error detection tests pass.

6. **Add provider configuration** to `src/llm/config.ts`:
   - Define env var requirement: `MYSERVICE_API_KEY` or similar.
   - Export a validation function: `export function validateMyProviderConfig(): boolean { return !!process.env.MYSERVICE_API_KEY; }`.
   - Verify: Config check passes when env vars are set.

7. **Register in provider resolution** (`src/llm/config.ts` or entry point):
   - Add condition: `if (process.env.MYSERVICE_API_KEY && validateMyProviderConfig()) { return 'my-provider'; }`.
   - Verify: Provider is detected when env var is present by checking `src/llm/config.ts` provider order.

8. **Test provider locally**:
   - Run `npm run test -- src/llm/__tests__/my-provider.test.ts` (create test file in `src/llm/__tests__/`).
   - Test file must cover: `call()` success/failure, `stream()` token yielding, `estimateTokens()` accuracy.
   - Verify: `npm run test:coverage` shows >80% coverage for provider file.

## Examples

**User says**: "Add support for Claude 3.5 Sonnet via custom endpoint"

**Actions**:
1. Create `src/llm/custom-endpoint.ts` implementing `LLMProvider`.
2. In `call()` method: POST to custom endpoint with `Authorization: Bearer ${process.env.CUSTOM_ENDPOINT_KEY}`.
3. In `stream()` method: POST with `stream: true`, yield chunks from SSE response.
4. Export `estimateTokensCustomEndpoint()` using same 4-char-per-token logic.
5. Update `src/llm/index.ts`: import provider, add to switch cases.
6. Update `src/llm/config.ts`: validate `CUSTOM_ENDPOINT_URL` and `CUSTOM_ENDPOINT_KEY` env vars.
7. Register in provider resolution: check `CUSTOM_ENDPOINT_URL` before Anthropic fallback.
8. Test: `npm run test -- src/llm/__tests__/custom-endpoint.test.ts`.

**Result**: `caliber init` detects custom endpoint when `CUSTOM_ENDPOINT_URL` is set and uses it for all LLM calls.

## Common Issues

**"Provider is not registered in llmCall()"**
- Verify `src/llm/index.ts` has your provider's `case 'your-provider-name':` in both `llmCall()` and `llmJsonCall()` switch statements.
- Check: `npm run build` passes without errors.
- Fix: Ensure case names match exactly in provider registration and in `config.ts` return value.

**"ENOENT: no such file or directory in src/llm/ after adding provider"**
- The provider file path in import statement does not match actual file.
- Fix: Run `ls src/llm/` to verify file exists, then check import path matches exactly (including extension `.ts`).

**"Type error: 'MyProvider' does not implement 'LLMProvider'"**
- Missing or incorrect method signatures.
- Fix: Verify `call()` returns `Promise<string>` and `stream()` is `AsyncGenerator<string>`. Both must accept `LLMCallParams` with no required properties besides `model` and `messages`.

**"llmCall() defaults to Anthropic even when my provider env var is set"**
- Provider detection in `src/llm/config.ts` is not being reached.
- Fix: Check the condition order in `getProvider()` — your provider check must come BEFORE Anthropic check. Move your `if (process.env.YOUR_KEY)` block above `if (process.env.ANTHROPIC_API_KEY)`.

**"Transient errors are retried infinitely"**
- Error is in `TRANSIENT_ERRORS` set but provider throws it on every call.
- Fix: Verify `TRANSIENT_ERRORS` contains exact error message or error code. Add logging: `console.error('Transient error:', error.code, error.message)` to debug. Remove error from `TRANSIENT_ERRORS` if it's not actually transient (fix the underlying issue first).

**"Token estimation is wildly off, causing budget overruns"**
- The 4-char-per-token estimate is inaccurate for your model.
- Fix: Use actual token counts from provider API responses (e.g., `response.usage.input_tokens`). Update `estimateTokens()` to return cached actual count or use provider's `countTokens()` API if available. Run `npm run test -- src/llm/usage.test.ts` to validate.