import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getCorsConfig } from './origins';

// CORS configuration using origins.ts
export const corsMw = cors(getCorsConfig());

// Simplified app factory for guard rail defaults
export const makeApp = () => {
  const app = express();

  const allow = (process.env.CORS_ALLOW ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const corsOpts = allow.length ? { origin: allow, credentials: true } : { origin: true, credentials: true };

  app.use(helmet());
  app.use(cors(corsOpts));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  app.use(express.json({ limit: "1mb" }));

  return app;
};

// Security headers
export const helmetMw = helmet({
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
export const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
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
export const requestIdMw = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.locals.requestId = requestId;
  next();
};

// Body size limit middleware (1MB max)
export const bodyLimitMw = (req: Request, res: Response, next: NextFunction) => {
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

// JSON only middleware
export const jsonOnlyMw = (req: Request, res: Response, next: NextFunction) => {
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

// Structured error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
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

// Structured request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
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

// Security middleware wrapper for Firebase Functions
export const withSecurityGuards = (handler: Function) => {
  return async (req: Request, res: Response) => {
    try {
      // Apply all security middleware in sequence
      await new Promise<void>((resolve, reject) => {
        requestIdMw(req, res, (err) => {
          if (err) return reject(err);
          
          corsMw(req, res, (err) => {
            if (err) return reject(err);
            
            helmetMw(req, res, (err) => {
              if (err) return reject(err);
              
              limiter(req, res, (err) => {
                if (err) return reject(err);
                
                bodyLimitMw(req, res, (err) => {
                  if (err) return reject(err);
                  
                  jsonOnlyMw(req, res, (err) => {
                    if (err) return reject(err);
                    
                    requestLogger(req, res, (err) => {
                      if (err) return reject(err);
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
      
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  };
};

// Validation middleware wrapper with structured errors
export const validate = (schema: any, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error: any) {
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