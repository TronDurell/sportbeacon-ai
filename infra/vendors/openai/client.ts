/* SportBeaconAI - OpenAI Client Type Façade
   Replaces vendor "any" types with proper TypeScript interfaces
*/

export interface OpenAIClientOptions {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
  function_call?: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  functions?: Function[];
  function_call?: 'auto' | 'none' | { name: string };
  stream?: boolean;
}

export interface Function {
  name: string;
  description?: string;
  parameters?: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: TokenUsage;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter';
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface EmbeddingRequest {
  input: string | string[];
  model: string;
  encoding_format?: 'float' | 'base64';
}

export interface EmbeddingResponse {
  object: string;
  data: Embedding[];
  model: string;
  usage: TokenUsage;
}

export interface Embedding {
  object: string;
  index: number;
  embedding: number[];
}

export interface OpenAIClient {
  chat: {
    completions: {
      create(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    };
  };
  embeddings: {
    create(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  };
}

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  defaultModel: string;
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
}

export class OpenAIClientFactory {
  static createClient(config: OpenAIConfig): OpenAIClient {
    // This would be implemented with actual OpenAI SDK
    // For now, return a mock interface
    return {
      chat: {
        completions: {
          create: async (request: ChatCompletionRequest): Promise<ChatCompletionResponse> => {
            throw new Error('OpenAI client not implemented - use actual SDK');
          }
        }
      },
      embeddings: {
        create: async (request: EmbeddingRequest): Promise<EmbeddingResponse> => {
          throw new Error('OpenAI embeddings not implemented - use actual SDK');
        }
      }
    };
  }
}
