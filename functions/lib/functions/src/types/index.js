"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTownStaffData = exports.isAuthContext = void 0;
// Type guards
/**
 * Type guard to check if context has authentication data
 * @param context - The callable context to check
 * @returns True if context has valid auth data
 */
function isAuthContext(context) {
    return context !== undefined &&
        context !== null &&
        typeof context === "object" &&
        "auth" in context &&
        context.auth !== undefined;
}
exports.isAuthContext = isAuthContext;
/**
 * Type guard to check if data is valid TownStaffData
 * @param data - The data to validate
 * @returns True if data matches TownStaffData interface
 */
function isTownStaffData(data) {
    return (typeof data === "object" &&
        data !== null &&
        "isActive" in data &&
        "role" in data &&
        "permissions" in data &&
        "createdAt" in data);
}
exports.isTownStaffData = isTownStaffData;
//# sourceMappingURL=index.js.map