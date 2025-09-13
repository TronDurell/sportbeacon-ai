import { RulesTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
export declare function initAdmin(): Promise<import("firebase-admin/app").App>;
export declare function initRulesEnv(projectId?: string): Promise<RulesTestEnvironment>;
export declare function cleanupEnv(): Promise<void>;
export { assertSucceeds, assertFails };
//# sourceMappingURL=testEnv.d.ts.map