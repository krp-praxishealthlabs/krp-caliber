import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeCliProvider, isClaudeCliAvailable } from '../claude-cli.js';
import type { LLMConfig } from '../types.js';

const spawn = vi.fn();
const execSync = vi.fn();

vi.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => spawn(...args),
  execSync: (...args: unknown[]) => execSync(...args),
}));

describe('ClaudeCliProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('call() spawns claude -p with combined prompt and returns stdout', async () => {
    const stdoutChunks = [Buffer.from('Hello from Claude.\n')];
    let closeCb: (code: number) => void;
    spawn.mockReturnValue({
      stdout: {
        on: vi.fn((ev: string, fn: (c: Buffer) => void) => {
          if (ev === 'data') setTimeout(() => stdoutChunks.forEach(fn), 0);
        }),
      },
      on: vi.fn((ev: string, fn: (code: number) => void) => {
        if (ev === 'close') closeCb = fn;
      }),
      kill: vi.fn(),
    });

    const config: LLMConfig = { provider: 'claude-cli', model: 'default' };
    const provider = new ClaudeCliProvider(config);

    const resultPromise = provider.call({
      system: 'You are helpful.',
      prompt: 'Say hello.',
    });

    await new Promise((r) => setTimeout(r, 10));
    closeCb!(0);

    const result = await resultPromise;
    expect(result).toBe('Hello from Claude.');
    expect(spawn).toHaveBeenCalledWith(
      'claude',
      expect.arrayContaining(['-p', expect.stringContaining('[[System]]')]),
      expect.objectContaining({ cwd: process.cwd() })
    );
    const promptArg = spawn.mock.calls[0][1][1];
    expect(promptArg).toContain('You are helpful.');
    expect(promptArg).toContain('Say hello.');
  });

  it('stream() calls call() then invokes onText and onEnd', async () => {
    let closeCb: (code: number) => void;
    spawn.mockReturnValue({
      stdout: {
        on: vi.fn((ev: string, fn: (c: Buffer) => void) => {
          if (ev === 'data') setTimeout(() => fn(Buffer.from('Streamed response.')), 0);
        }),
      },
      on: vi.fn((ev: string, fn: (code: number) => void) => {
        if (ev === 'close') closeCb = fn;
      }),
      kill: vi.fn(),
    });

    const provider = new ClaudeCliProvider({ provider: 'claude-cli', model: 'default' });
    const onText = vi.fn();
    const onEnd = vi.fn();

    const streamPromise = provider.stream(
      { system: 'S', prompt: 'P' },
      { onText, onEnd, onError: vi.fn() }
    );

    await new Promise((r) => setTimeout(r, 10));
    closeCb!(0);
    await streamPromise;

    expect(onText).toHaveBeenCalledWith('Streamed response.');
    expect(onEnd).toHaveBeenCalledWith({ stopReason: 'end_turn' });
  });

  it('uses CALIBER_CLAUDE_CLI_TIMEOUT_MS when set', () => {
    const orig = process.env.CALIBER_CLAUDE_CLI_TIMEOUT_MS;
    process.env.CALIBER_CLAUDE_CLI_TIMEOUT_MS = '120000';
    const provider = new ClaudeCliProvider({ provider: 'claude-cli', model: 'default' });
    expect(provider).toBeDefined();
    process.env.CALIBER_CLAUDE_CLI_TIMEOUT_MS = orig;
  });
});

describe('isClaudeCliAvailable', () => {
  beforeEach(() => {
    execSync.mockReset();
  });

  it('returns true when claude is on PATH', () => {
    execSync.mockReturnValue(undefined);
    expect(isClaudeCliAvailable()).toBe(true);
    expect(execSync).toHaveBeenCalled();
    const cmd = execSync.mock.calls[0][0];
    expect(cmd).toContain('claude');
    expect(execSync.mock.calls[0][1]).toEqual({ stdio: 'ignore' });
  });

  it('returns false when claude is not found', () => {
    execSync.mockImplementation(() => {
      throw new Error('not found');
    });
    expect(isClaudeCliAvailable()).toBe(false);
  });
});
