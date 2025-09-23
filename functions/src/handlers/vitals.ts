import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { logger } from 'firebase-functions';
import { withSecurityGuards } from '../lib/http';
import { z } from 'zod';

// Zod schema for Web Vitals data
const vitalMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  delta: z.number(),
  id: z.string(),
  navigationType: z.string(),
  rating: z.enum(['good', 'needs-improvement', 'poor'])
});

const vitalsReportSchema = z.object({
  timestamp: z.number(),
  url: z.string().url(),
  userAgent: z.string(),
  connection: z.string().optional(),
  metrics: z.array(vitalMetricSchema)
});

export const vitals = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate the request body
    const report = vitalsReportSchema.parse(req.body);
    
    // Log the metrics for analysis
    logger.info('Web Vitals received', {
      requestId,
      url: report.url,
      metricsCount: report.metrics.length,
      timestamp: report.timestamp,
      connection: report.connection
    });

    // Log individual metrics
    report.metrics.forEach((metric) => {
      logger.info(`Web Vital: ${metric.name}`, {
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

  } catch (error: any) {
    logger.error('Web Vitals processing error', error, { requestId });
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Invalid Web Vitals data format',
        errors: error.errors,
        requestId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Web Vitals processing failed',
        error: error.message,
        requestId
      });
    }
  }
}));
