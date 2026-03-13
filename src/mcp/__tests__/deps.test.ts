import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractAllDeps } from '../deps.js';

describe('extractAllDeps', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caliber-deps-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('extracts deps from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { supabase: '1.0', stripe: '2.0' },
      devDependencies: { vitest: '1.0' },
    }));

    const deps = extractAllDeps(tmpDir);
    expect(deps).toContain('supabase');
    expect(deps).toContain('stripe');
    expect(deps).toContain('vitest');
  });

  it('extracts deps from requirements.txt', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), [
      'django==4.2',
      'stripe>=5.0',
      '# comment',
      'sentry-sdk[flask]',
    ].join('\n'));

    const deps = extractAllDeps(tmpDir);
    expect(deps).toContain('django');
    expect(deps).toContain('stripe');
    expect(deps).toContain('sentry-sdk');
  });

  it('extracts deps from go.mod', () => {
    fs.writeFileSync(path.join(tmpDir, 'go.mod'), [
      'module example.com/myapp',
      '',
      'require (',
      '\tgithub.com/stripe/stripe-go v76.0.0',
      '\tgithub.com/supabase-community/supabase-go v0.1.0',
      ')',
    ].join('\n'));

    const deps = extractAllDeps(tmpDir);
    expect(deps).toContain('stripe-go');
    expect(deps).toContain('supabase-go');
  });

  it('extracts deps from Gemfile', () => {
    fs.writeFileSync(path.join(tmpDir, 'Gemfile'), [
      "gem 'rails'",
      "gem 'stripe'",
      "gem 'sentry-ruby'",
    ].join('\n'));

    const deps = extractAllDeps(tmpDir);
    expect(deps).toContain('rails');
    expect(deps).toContain('stripe');
    expect(deps).toContain('sentry-ruby');
  });

  it('returns empty array when no dep files exist', () => {
    const deps = extractAllDeps(tmpDir);
    expect(deps).toEqual([]);
  });

  it('deduplicates across multiple files', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { stripe: '1.0' },
    }));
    // Even if two files mention 'stripe', it should only appear once
    const deps = extractAllDeps(tmpDir);
    const stripeCount = deps.filter(d => d === 'stripe').length;
    expect(stripeCount).toBe(1);
  });
});
