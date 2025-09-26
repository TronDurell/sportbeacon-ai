"use strict";
// Shared types for Functions workspace
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthContext = isAuthContext;
// Utility functions
function isAuthContext(context) {
    return context && typeof context.uid === 'string';
}
