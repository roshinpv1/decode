/**
 * LLM Client Types - TypeScript equivalent of Python LLM client
 * Comprehensive LLM integration supporting multiple providers
 */

export enum LLMProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic", 
  GEMINI = "gemini",
  OLLAMA = "ollama",
  LOCAL = "local",
  ENTERPRISE = "enterprise",
  APIGEE = "apigee"
}

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface TokenInfo {
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  timestamp: Date;
}

export interface ApigeeTokenCache {
  token: string | null;
  expiresAt: number;
}

export interface LLMCallOptions {
  useCache?: boolean;
  timeout?: number;
  retries?: number;
}

export interface ProviderAvailability {
  [LLMProvider.OPENAI]: boolean;
  [LLMProvider.ANTHROPIC]: boolean;
  [LLMProvider.GEMINI]: boolean;
  [LLMProvider.OLLAMA]: boolean;
  [LLMProvider.LOCAL]: boolean;
  [LLMProvider.ENTERPRISE]: boolean;
  [LLMProvider.APIGEE]: boolean;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public provider: LLMProvider,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
