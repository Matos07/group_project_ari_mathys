import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { adminUsersHtml } from './views/adminUsersHtml.js';

export function createApp(configureRoutes?: (app: Express) => void): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser(config.sessionSecret));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Authentication & session management endpoints (F-01)
  app.use('/api/auth', authRouter);

  // Administrator user management endpoints (F-02)
  app.use('/api/admin', adminRouter);

  // Administrator Dashboard UI (F-02, NFR-10)
  app.get('/admin/users', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(adminUsersHtml);
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
