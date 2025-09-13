export declare const db: FirebaseFirestore.Firestore;
export declare const adminMemoryClient: () => {
    remember: (key: string, value: any) => Promise<void>;
    recall: (key: string) => Promise<any>;
    forget: (key: string) => Promise<void>;
    captureFunctionResult: (functionName: string, result: any, duration: number) => Promise<void>;
    captureFunctionError: (functionName: string, error: any) => Promise<void>;
    writeSnapshot: (uid: string, data: any) => Promise<void>;
    writeEvent: (kind: string, data: any) => Promise<void>;
};
//# sourceMappingURL=client.d.ts.map