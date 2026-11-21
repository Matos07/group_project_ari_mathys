import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { prisma } from './db/client.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { accountsRouter } from './routes/accounts.js';
import { transactionsRouter } from './routes/transactions.js';
import { summaryRouter } from './routes/summary.js';
import { adminUsersHtml } from './views/adminUsersHtml.js';
import { overviewHtml } from './views/overviewHtml.js';

export function createApp(configureRoutes?: (app: Express) => void): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser(config.sessionSecret));

  // Health check endpoint (liveness check)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Readiness check endpoint (verifies database connectivity per Lab 5 contract)
  app.get('/api/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready', db: 'connected' });
    } catch {
      res.status(503).json({ status: 'error', db: 'disconnected' });
    }
  });

  // Redirect root and /login to overview
  app.get('/', (_req, res) => {
    res.redirect('/overview');
  });
  app.get('/login', (_req, res) => {
    res.redirect('/overview');
  });

  // Authentication & session management endpoints (F-01)
  app.use('/api/auth', authRouter);

  // Administrator user management endpoints (F-02)
  app.use('/api/admin', adminRouter);

  // Financial accounts & overview endpoints (F-03)
  app.use('/api/accounts', accountsRouter);

  // Financial transactions endpoints (F-04, F-05, F-06)
  app.use('/api/transactions', transactionsRouter);

  // Financial summary endpoints (F-07)
  app.use('/api/summary', summaryRouter);

  // Administrator Dashboard UI (F-02, NFR-10)
  app.get('/admin/users', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(adminUsersHtml);
  });

  // User Account Overview UI (F-03, NFR-10)
  app.get('/overview', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(overviewHtml);
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
