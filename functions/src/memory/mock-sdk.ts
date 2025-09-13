/* SportBeaconAI - Mock Memory SDK for Functions
   Provides mock implementation when @sportbeacon/memory-sdk is not available
*/

export interface MemoryClient {
  writeEvent(userId: string, event: any): Promise<void>;
  feedback(userId: string, message: string, tags?: string[], trace?: string): Promise<void>;
  captureFunctionResult(uid: string, functionName: string, result: any, executionTime?: number, trace?: string): Promise<void>;
  captureFunctionError(uid: string, functionName: string, error: Error, context?: any, trace?: string): Promise<void>;
  captureFunctionObservation(uid: string, observation: string, data?: any, trace?: string): Promise<void>;
  writeSnapshot(uid: string, data: any): Promise<void>;
}

export interface MemoryClientOpts {
  apiKey?: string;
  baseUrl?: string;
  app?: any;
  projectId?: string;
}

export function memoryClient(opts?: MemoryClientOpts): MemoryClient {
  return {
    async writeEvent(userId: string, event: any): Promise<void> {
      console.log(`[MOCK] Memory event for ${userId}:`, event);
    },
    async feedback(userId: string, message: string, tags?: string[], trace?: string): Promise<void> {
      console.log(`[MOCK] Memory feedback for ${userId}:`, { message, tags, trace });
    },
    async captureFunctionResult(uid: string, functionName: string, result: any, executionTime?: number, trace?: string): Promise<void> {
      console.log(`[MOCK] Function result for ${uid}/${functionName}:`, { result, executionTime, trace });
    },
    async captureFunctionError(uid: string, functionName: string, error: Error, context?: any, trace?: string): Promise<void> {
      console.log(`[MOCK] Function error for ${uid}/${functionName}:`, { error: error.message, context, trace });
    },
    async captureFunctionObservation(uid: string, observation: string, data?: any, trace?: string): Promise<void> {
      console.log(`[MOCK] Function observation for ${uid}:`, { observation, data, trace });
    },
    async writeSnapshot(uid: string, data: any): Promise<void> {
      console.log(`[MOCK] Snapshot for ${uid}:`, data);
    }
  };
}

export const adminMemoryClient = memoryClient;
