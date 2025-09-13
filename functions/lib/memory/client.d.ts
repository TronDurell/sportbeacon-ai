export interface AdminMemoryClientOpts {
    projectId?: string;
}
export declare function adminMemoryClient(opts?: AdminMemoryClientOpts): {
    captureFunctionResult: (uid: string, functionName: string, result: any, executionTime?: number, trace?: string) => Promise<void>;
    captureFunctionError: (uid: string, functionName: string, error: Error, context?: any, trace?: string) => Promise<void>;
    captureFunctionObservation: (uid: string, observation: string, data: any, tags?: string[], trace?: string) => Promise<void>;
    sanitizeData: (data: any) => any;
    writeEvent(userId: string, event: any): Promise<void>;
    feedback(userId: string, message: string, tags?: string[], trace?: string): Promise<void>;
    writeSnapshot(uid: string, data: any): Promise<void>;
};
export type AdminMemoryClient = ReturnType<typeof adminMemoryClient>;
//# sourceMappingURL=client.d.ts.map