import fs from 'fs';
import path from 'path';

/**
 * Extract all dependency names from common package manager files.
 * Returns a flat array of dependency names (no versions).
 */
export function extractAllDeps(dir: string): string[] {
  const deps = new Set<string>();

  parsePackageJson(dir, deps);
  parseRequirementsTxt(dir, deps);
  parsePyprojectToml(dir, deps);
  parseGoMod(dir, deps);
  parseCargoToml(dir, deps);
  parseGemfile(dir, deps);
  parseComposerJson(dir, deps);

  return Array.from(deps);
}

function readFileSafe(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch { /* ignore */ }
  return null;
}

function parsePackageJson(dir: string, deps: Set<string>): void {
  const content = readFileSafe(path.join(dir, 'package.json'));
  if (!content) return;

  try {
    const pkg = JSON.parse(content);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    for (const name of Object.keys(allDeps)) {
      deps.add(name);
    }
  } catch { /* invalid JSON */ }
}

function parseRequirementsTxt(dir: string, deps: Set<string>): void {
  const content = readFileSafe(path.join(dir, 'requirements.txt'));
  if (!content) return;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue;
    // Extract package name before version specifier
    const match = trimmed.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)/);
    if (match) {
      deps.add(match[1].replace(/\[.*\]/, '').toLowerCase());
    }
  }
}

function parsePyprojectToml(dir: string, deps: Set<string>): void {
  const content = readFileSafe(path.join(dir, 'pyproject.toml'));
  if (!content) return;

  // Match dependencies = ["package>=1.0", ...] in [project] section
  const depsMatch = content.match(/\bdependencies\s*=\s*\[([\s\S]*?)\]/);
  if (depsMatch) {
    const items = depsMatch[1].matchAll(/"([a-zA-Z0-9_-]+)/g);
    for (const m of items) {
      deps.add(m[1].toLowerCase());
    }
  }
}

function parseGoMod(dir: string, deps: Set<string>): void {
  const content = readFileSafe(path.join(dir, 'go.mod'));
  if (!content) return;

  // Match require blocks and single require lines
  const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/g);
  if (requireBlock) {
    for (const block of requireBlock) {
      const lines = block.split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^([a-zA-Z0-9./\-_]+)\s/);
        if (match && !match[1].startsWith('//') && match[1].includes('/')) {
          // Extract the last segment as dep name (e.g., github.com/stripe/stripe-go → stripe-go)
          const parts = match[1].split('/');
          deps.add(parts[parts.length - 1]);
        }
      }
    }
  }
}

function parseCargoToml(dir: string, deps: Set<string>): void {
  const content = readFileSafe(path.join(dir, 'Cargo.toml'));
  if (!content) return;

  // Match [dependencies] section entries
  const sections = content.split(/\[/);
  for (const section of sections) {
    if (section.startsWith('dependencies]') || section.startsWith('dev-dependencies]')) {
      const lines = section.split('\n').slice(1);
      for (const line of lines) {
        if (line.startsWith('[')) break;
        const match = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
        if (match) {
          deps.add(match[1]);
        }
      }
    }
  }
}

function parseGemfile(dir: string, deps: Set<string>): void {
  const content = readFileSafe(path.join(dir, 'Gemfile'));
  if (!content) return;

  const gemPattern = /gem\s+['"]([a-zA-Z0-9_-]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = gemPattern.exec(content)) !== null) {
    deps.add(match[1]);
  }
}

function parseComposerJson(dir: string, deps: Set<string>): void {
  const content = readFileSafe(path.join(dir, 'composer.json'));
  if (!content) return;

  try {
    const composer = JSON.parse(content);
    const allDeps = {
      ...composer.require,
      ...composer['require-dev'],
    };
    for (const name of Object.keys(allDeps)) {
      if (name !== 'php' && !name.startsWith('ext-')) {
        deps.add(name);
      }
    }
  } catch { /* invalid JSON */ }
}
