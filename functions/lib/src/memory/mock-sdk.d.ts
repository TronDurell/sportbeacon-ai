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
export declare function memoryClient(opts?: MemoryClientOpts): MemoryClient;
export declare const adminMemoryClient: typeof memoryClient;
//# sourceMappingURL=mock-sdk.d.ts.map