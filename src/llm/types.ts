export type ProviderType = 'anthropic' | 'vertex' | 'openai' | 'cursor' | 'claude-cli';

export interface LLMConfig {
  provider: ProviderType;
  model: string;
  fastModel?: string;
  apiKey?: string;
  baseUrl?: string;
  vertexProjectId?: string;
  vertexRegion?: string;
  vertexCredentials?: string;
}

export interface LLMCallOptions {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface LLMStreamCallbacks {
  onText: (text: string) => void;
  onEnd: (meta?: { stopReason?: string }) => void;
  onError: (error: Error) => void;
}

export interface LLMStreamOptions extends LLMCallOptions {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface LLMProvider {
  call(options: LLMCallOptions): Promise<string>;
  stream(options: LLMStreamOptions, callbacks: LLMStreamCallbacks): Promise<void>;
}
