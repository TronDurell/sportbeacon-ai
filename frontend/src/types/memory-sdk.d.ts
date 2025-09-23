declare module '@sportbeacon/memory-sdk' {
  export interface Memory {
    id: string;
    text: string;
    timestamp: Date;
    userId: string;
    tags: string[];
    metadata?: Record<string, any>;
  }

  export interface Feedback {
    id: string;
    memoryId: string;
    userId: string;
    rating: number;
    comment?: string;
    timestamp: Date;
  }

  export interface MemoryEventKind {
    type: 'note' | 'feedback' | 'observation' | 'tool' | 'result';
    category: string;
    tags: string[];
    metadata?: Record<string, any>;
  }

  export interface MemoryClient {
    captureEvent(kind: MemoryEventKind['type'], data: any, tags: string[], category: string): Promise<void>;
    captureFeedback(text: string, tags: string[], category: string): Promise<void>;
    getMemories(userId: string, limit?: number): Promise<Memory[]>;
    getFeedback(memoryId: string): Promise<Feedback[]>;
  }

  export class MemorySDK {
    constructor(config?: any);
    captureEvent(kind: MemoryEventKind['type'], data: any, tags: string[], category: string): Promise<void>;
    captureFeedback(text: string, tags: string[], category: string): Promise<void>;
    getMemories(userId: string, limit?: number): Promise<Memory[]>;
    getFeedback(memoryId: string): Promise<Feedback[]>;
  }

  export const memoryClient: MemoryClient;
  export const MemorySDK: typeof MemorySDK;
}
