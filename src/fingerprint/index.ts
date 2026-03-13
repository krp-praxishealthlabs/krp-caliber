import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getGitRemoteUrl } from './git.js';
import { getFileTree } from './file-tree.js';
import { readExistingConfigs } from './existing-config.js';
import { analyzeCode, CodeAnalysis } from './code-analysis.js';
import { detectProjectStack } from '../ai/detect.js';
import { loadConfig } from '../llm/config.js';

export type { CodeAnalysis };

export interface Fingerprint {
  gitRemoteUrl?: string;
  packageName?: string;
  languages: string[];
  frameworks: string[];
  tools: string[];
  fileTree: string[];
  existingConfigs: ReturnType<typeof readExistingConfigs>;
  codeAnalysis?: CodeAnalysis;
  description?: string;
}

export function collectFingerprint(dir: string): Fingerprint {
  const gitRemoteUrl = getGitRemoteUrl();
  const fileTree = getFileTree(dir);
  const existingConfigs = readExistingConfigs(dir);
  const codeAnalysis = analyzeCode(dir);
  const packageName = readPackageName(dir);

  return {
    gitRemoteUrl,
    packageName,
    languages: [],
    frameworks: [],
    tools: [],
    fileTree,
    existingConfigs,
    codeAnalysis,
  };
}

function readPackageName(dir: string): string | undefined {
  try {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return undefined;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.name;
  } catch {
    return undefined;
  }
}

export function computeFingerprintHash(fingerprint: Fingerprint): string {
  const key = [
    fingerprint.gitRemoteUrl || '',
    fingerprint.packageName || '',
  ].join('::');

  return crypto.createHash('sha256').update(key).digest('hex');
}

const DEP_FILE_PATTERNS = [
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'setup.py',
  'Pipfile',
  'Cargo.toml',
  'go.mod',
  'Gemfile',
  'build.gradle',
  'pom.xml',
  'composer.json',
];

const MAX_CONTENT_SIZE = 50 * 1024;

export async function enrichFingerprintWithLLM(fingerprint: Fingerprint, dir: string): Promise<void> {
  try {
    const config = loadConfig();
    if (!config) return;

    const fileContents: Record<string, string> = {};
    let totalSize = 0;

    for (const treePath of fingerprint.fileTree) {
      const basename = path.basename(treePath);
      if (!DEP_FILE_PATTERNS.includes(basename)) continue;

      const fullPath = path.join(dir, treePath);
      if (!fs.existsSync(fullPath)) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (totalSize + content.length > MAX_CONTENT_SIZE) break;
        fileContents[treePath] = content;
        totalSize += content.length;
      } catch {
        continue;
      }
    }

    if (Object.keys(fileContents).length === 0 && fingerprint.fileTree.length === 0) return;

    const result = await detectProjectStack(fingerprint.fileTree, fileContents);

    if (result.languages?.length) {
      const langSet = new Set(fingerprint.languages);
      for (const lang of result.languages) langSet.add(lang);
      fingerprint.languages = [...langSet];
    }

    if (result.frameworks?.length) {
      const fwSet = new Set(fingerprint.frameworks);
      for (const fw of result.frameworks) fwSet.add(fw);
      fingerprint.frameworks = [...fwSet];
    }

    if (result.tools?.length) {
      const toolSet = new Set(fingerprint.tools);
      for (const tool of result.tools) toolSet.add(tool);
      fingerprint.tools = [...toolSet];
    }
  } catch {
    // Silently fall back to local detection
  }
}
