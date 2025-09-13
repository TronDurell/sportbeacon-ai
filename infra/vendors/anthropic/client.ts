/* SportBeaconAI - Anthropic Client Type Façade
   Replaces vendor "any" types with proper TypeScript interfaces
*/

export interface AnthropicClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicCompletionRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: {
    user_id?: string;
  };
}

export interface AnthropicCompletionResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicContent[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: AnthropicUsage;
}

export interface AnthropicContent {
  type: 'text';
  text: string;
}

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface AnthropicClient {
  messages: {
    create(request: AnthropicCompletionRequest): Promise<AnthropicCompletionResponse>;
  };
}

export interface AnthropicConfig {
  apiKey: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
}

export class AnthropicClientFactory {
  static createClient(config: AnthropicConfig): AnthropicClient {
    // This would be implemented with actual Anthropic SDK
    // For now, return a mock interface
    return {
      messages: {
        create: async (request: AnthropicCompletionRequest): Promise<AnthropicCompletionResponse> => {
          throw new Error('Anthropic client not implemented - use actual SDK');
        }
      }
    };
  }
}
