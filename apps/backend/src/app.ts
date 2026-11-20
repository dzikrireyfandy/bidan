import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import crypto from 'crypto';

import config from './config/env';
import v1Router from './routes/v1';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { clientContext } from './middleware/clientContext';
import { originGuard, isOriginAllowed } from './middleware/originGuard';
import { createRateLimiter } from './middleware/rateLimit';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(originGuard);
  app.use(
    cors({
      origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-App'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      maxAge: 600
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use((req: Request, res: Response, next) => {
    req.id = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  });

  app.use(clientContext);

  const globalLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    keyPrefix: 'global'
  });
  const authLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.AUTH_RATE_LIMIT_MAX,
    keyPrefix: 'auth'
  });

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime()
      }
    });
  });

  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/reset', authLimiter);
  app.use('/api/v1', globalLimiter, v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
