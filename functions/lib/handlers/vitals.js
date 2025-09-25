"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitals = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const http_1 = require("../lib/http");
const zod_1 = require("zod");
// Zod schema for Web Vitals data
const vitalMetricSchema = zod_1.z.object({
    name: zod_1.z.string(),
    value: zod_1.z.number(),
    delta: zod_1.z.number(),
    id: zod_1.z.string(),
    navigationType: zod_1.z.string(),
    rating: zod_1.z.enum(['good', 'needs-improvement', 'poor'])
});
const vitalsReportSchema = zod_1.z.object({
    timestamp: zod_1.z.number(),
    url: zod_1.z.string().url(),
    userAgent: zod_1.z.string(),
    connection: zod_1.z.string().optional(),
    metrics: zod_1.z.array(vitalMetricSchema)
});
exports.vitals = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate the request body
        const report = vitalsReportSchema.parse(req.body);
        // Log the metrics for analysis
        firebase_functions_1.logger.info('Web Vitals received', {
            requestId,
            url: report.url,
            metricsCount: report.metrics.length,
            timestamp: report.timestamp,
            connection: report.connection
        });
        // Log individual metrics
        report.metrics.forEach((metric) => {
            firebase_functions_1.logger.info(`Web Vital: ${metric.name}`, {
                requestId,
                metric: {
                    name: metric.name,
                    value: metric.value,
                    rating: metric.rating,
                    navigationType: metric.navigationType
                },
                url: report.url,
                timestamp: report.timestamp
            });
        });
        // Store in Firestore for analysis (optional)
        // This would require Firestore admin SDK
        // await storeVitalsData(report);
        res.json({
            success: true,
            message: 'Web Vitals received',
            requestId,
            metricsReceived: report.metrics.length
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Web Vitals processing error', error, { requestId });
        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                message: 'Invalid Web Vitals data format',
                errors: error.errors,
                requestId
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Web Vitals processing failed',
                error: error.message,
                requestId
            });
        }
    }
}));
