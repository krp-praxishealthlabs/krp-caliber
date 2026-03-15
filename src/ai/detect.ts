import { llmJsonCall } from '../llm/index.js';
import { getFastModel } from '../llm/config.js';
import { FINGERPRINT_SYSTEM_PROMPT } from './prompts.js';

interface DetectResult {
  languages: string[];
  frameworks: string[];
  tools: string[];
}

export async function detectProjectStack(
  fileTree: string[],
  fileContents: Record<string, string>
): Promise<DetectResult> {
  const parts: string[] = ['Analyze this project and detect languages, frameworks, and external tools/services.\n'];

  if (fileTree.length > 0) {
    const cappedTree = fileTree.slice(0, 500);
    parts.push(`File tree (${cappedTree.length}/${fileTree.length} entries):`);
    parts.push(cappedTree.join('\n'));
  }

  if (Object.keys(fileContents).length > 0) {
    parts.push('\nDependency file contents:');
    for (const [filePath, content] of Object.entries(fileContents)) {
      parts.push(`\n[${filePath}]`);
      parts.push(content);
    }
  }

  const fastModel = getFastModel();

  const result = await llmJsonCall<DetectResult>({
    system: FINGERPRINT_SYSTEM_PROMPT,
    prompt: parts.join('\n'),
    ...(fastModel ? { model: fastModel } : {}),
  });

  return {
    languages: Array.isArray(result.languages) ? result.languages : [],
    frameworks: Array.isArray(result.frameworks) ? result.frameworks : [],
    tools: Array.isArray(result.tools) ? result.tools : [],
  };
}
