import { TodoFixMe } from "../types";
export declare const adminGetLeagueStats: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data?: undefined;
} | {
    success: boolean;
    data: {
        totalTeams: number;
        totalPlayers: number;
        averageTeamSize: number;
    };
    message?: undefined;
}>, unknown>;
export declare const adminUpdateStaffRole: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
export declare const adminGenerateReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    data: {
        type: any;
        dateRange: any;
        generatedAt: Date;
        data: TodoFixMe;
    };
    message?: undefined;
} | {
    success: boolean;
    message: string;
    data?: undefined;
}>, unknown>;
export declare const adminUpdateConfig: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
export declare const adminBulkOperation: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    data: {
        registrationId: any;
        operation: any;
        success: boolean;
    }[];
    message?: undefined;
} | {
    success: boolean;
    message: string;
    data?: undefined;
}>, unknown>;
export declare const adminSystemHealth: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    data: {
        database: string;
        functions: string;
        storage: string;
        timestamp: Date;
    };
    message?: undefined;
} | {
    success: boolean;
    message: string;
    data?: undefined;
}>, unknown>;
//# sourceMappingURL=index.d.ts.map