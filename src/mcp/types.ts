export interface McpCandidate {
  name: string;
  repoFullName: string;
  url: string;
  description: string;
  stars: number;
  lastPush: string;
  vendor: boolean;
  score: number;
  reason: string;
  matchedDep: string;
}

export interface McpConfigTemplate {
  command: string;
  args: string[];
  env: Array<{
    key: string;
    description: string;
    required: boolean;
  }>;
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpDiscoveryResult {
  installed: number;
  names: string[];
}
