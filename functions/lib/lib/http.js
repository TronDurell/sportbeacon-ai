"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.withSecurityGuards = exports.requestLogger = exports.errorHandler = exports.jsonOnlyMw = exports.bodyLimitMw = exports.requestIdMw = exports.limiter = exports.helmetMw = exports.makeApp = exports.corsMw = void 0;
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const origins_1 = require("./origins");
// CORS configuration using origins.ts
exports.corsMw = (0, cors_1.default)((0, origins_1.getCorsConfig)());
// Simplified app factory for guard rail defaults
const makeApp = () => {
    const app = (0, express_1.default)();
    const allow = (process.env.CORS_ALLOW ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const corsOpts = allow.length ? { origin: allow, credentials: true } : { origin: true, credentials: true };
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)(corsOpts));
    app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 }));
    app.use(express_1.default.json({ limit: "1mb" }));
    return app;
};
exports.makeApp = makeApp;
// Security headers
exports.helmetMw = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
});
// Rate limiting - stricter for production
exports.limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/';
    }
});
// Request ID middleware
const requestIdMw = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.headers['x-request-id'] = requestId;
    res.locals.requestId = requestId;
    next();
};
exports.requestIdMw = requestIdMw;
// Body size limit middleware (1MB max)
const bodyLimitMw = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = 1024 * 1024; // 1MB
    if (contentLength > maxSize) {
        return res.status(413).json({
            error: 'Payload too large',
            maxSize: `${maxSize} bytes`,
            requestId: res.locals.requestId
        });
    }
    next();
};
exports.bodyLimitMw = bodyLimitMw;
// JSON only middleware
const jsonOnlyMw = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({
                error: 'Content-Type must be application/json',
                requestId: res.locals.requestId
            });
        }
    }
    next();
};
exports.jsonOnlyMw = jsonOnlyMw;
// Structured error handling middleware
const errorHandler = (err, req, res, next) => {
    const requestId = res.locals.requestId || 'unknown';
    // Structured logging
    console.log(JSON.stringify({
        level: 'error',
        message: err.message,
        requestId,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: err.stack
    }));
    // Handle specific error types
    if (err.name === 'BadRequest') {
        return res.status(400).json({
            error: err.message,
            requestId
        });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            requestId
        });
    }
    if (err.name === 'ForbiddenError') {
        return res.status(403).json({
            error: 'Forbidden',
            requestId
        });
    }
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.message,
            requestId
        });
    }
    // Default 500 error
    return res.status(500).json({
        error: 'Internal server error',
        requestId
    });
};
exports.errorHandler = errorHandler;
// Structured request logging middleware
const requestLogger = (req, res, next) => {
    const requestId = res.locals.requestId || 'unknown';
    console.log(JSON.stringify({
        level: 'info',
        message: 'Request received',
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    }));
    // Log response on finish
    res.on('finish', () => {
        console.log(JSON.stringify({
            level: 'info',
            message: 'Request completed',
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: Date.now() - res.locals.startTime,
            timestamp: new Date().toISOString()
        }));
    });
    res.locals.startTime = Date.now();
    next();
};
exports.requestLogger = requestLogger;
// Security middleware wrapper for Firebase Functions
const withSecurityGuards = (handler) => {
    return async (req, res) => {
        try {
            // Apply all security middleware in sequence
            await new Promise((resolve, reject) => {
                (0, exports.requestIdMw)(req, res, (err) => {
                    if (err)
                        return reject(err);
                    (0, exports.corsMw)(req, res, (err) => {
                        if (err)
                            return reject(err);
                        (0, exports.helmetMw)(req, res, (err) => {
                            if (err)
                                return reject(err);
                            (0, exports.limiter)(req, res, (err) => {
                                if (err)
                                    return reject(err);
                                (0, exports.bodyLimitMw)(req, res, (err) => {
                                    if (err)
                                        return reject(err);
                                    (0, exports.jsonOnlyMw)(req, res, (err) => {
                                        if (err)
                                            return reject(err);
                                        (0, exports.requestLogger)(req, res, (err) => {
                                            if (err)
                                                return reject(err);
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
            // Call the actual handler
            await handler(req, res);
        }
        catch (error) {
            (0, exports.errorHandler)(error, req, res, () => { });
        }
    };
};
exports.withSecurityGuards = withSecurityGuards;
// Validation middleware wrapper with structured errors
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const data = req[source];
            const validated = schema.parse(data);
            req[source] = validated;
            next();
        }
        catch (error) {
            const requestId = res.locals.requestId || 'unknown';
            console.log(JSON.stringify({
                level: 'error',
                message: 'Validation error',
                requestId,
                path: req.path,
                method: req.method,
                source,
                error: error.message
            }));
            return res.status(400).json({
                error: 'Validation error',
                details: error.message,
                requestId
            });
        }
    };
};
exports.validate = validate;
