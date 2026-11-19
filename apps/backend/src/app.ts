import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import crypto from 'crypto';

import v1Router from './routes/v1';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { clientContext } from './middleware/clientContext';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use((req: Request, res: Response, next) => {
    req.id = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  });

  app.use(clientContext);

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime()
      }
    });
  });

  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
