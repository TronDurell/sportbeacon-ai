"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoAnalyze = void 0;
const https_1 = require("firebase-functions/v2/https");
const http_1 = require("../lib/http");
const validate_1 = require("../lib/validate");
const zod_1 = require("zod");
const logger = __importStar(require("firebase-functions/logger"));
const schema = zod_1.z.object({
    tid: zod_1.z.string().min(1),
    videoUrl: zod_1.z.string().url(),
    model: zod_1.z.enum(['pose', 'speed', 'balance']).default('pose')
});
exports.videoAnalyze = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        const { tid, videoUrl, model } = (0, validate_1.validateBody)(schema, req.body);
        logger.info(`Video analysis request: ${tid}`, { requestId, tid, model });
        // TODO: Implement actual video analysis logic
        res.status(200).json({
            ok: true,
            tid,
            model,
            analysis: {
                pose: { score: 85, confidence: 0.9 },
                speed: { score: 78, confidence: 0.85 },
                balance: { score: 82, confidence: 0.88 }
            },
            requestId
        });
    }
    catch (error) {
        if (error.name === 'BadRequest') {
            res.status(400).json({
                error: error.message,
                requestId
            });
            return;
        }
        logger.error('Video analysis error:', error, { requestId });
        res.status(500).json({
            ok: false,
            error: error?.message ?? 'Internal error',
            requestId
        });
    }
}));
