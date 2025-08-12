export declare const adminGetLeagueStats: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    message: string;
    success: boolean;
    error?: any;
    data?: any;
} | {
    success: boolean;
    message: string;
    data: null;
    errors: {
        field: string;
        message: string;
    }[] | undefined;
} | undefined>, unknown>;
export declare const adminUpdateStaffRole: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    message: string;
    success: boolean;
    error?: any;
    data?: any;
} | {
    success: boolean;
    message: string;
    data: null;
    errors: {
        field: string;
        message: string;
    }[] | undefined;
} | undefined>, unknown>;
export declare const adminGenerateReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    message: string;
    success: boolean;
    error?: any;
    data?: any;
} | {
    success: boolean;
    message: string;
    data: null;
    errors: {
        field: string;
        message: string;
    }[] | undefined;
} | undefined>, unknown>;
export declare const adminUpdateConfig: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
export declare const adminBulkOperation: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
export declare const adminGetSystemHealth: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    data: {
        database: string;
        storage: string;
        functions: string;
        lastChecked: Date;
    };
    message?: undefined;
} | {
    success: boolean;
    message: string;
    data?: undefined;
}>, unknown>;
//# sourceMappingURL=index.d.ts.map