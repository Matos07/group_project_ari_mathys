import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(configureRoutes?: (app: Express) => void): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser(config.sessionSecret));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  if (configureRoutes) {
    configureRoutes(app);
  }

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Central error handler
  app.use(errorHandler);

  return app;
}
