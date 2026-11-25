import { createApp } from './app.js';
import { config } from './config/env.js';
import { ensureDemoUsers } from './startup-seed.js';

const app = createApp();

// Sync demo user passwords with the current secret on every cold start,
// then start accepting traffic.
ensureDemoUsers()
  .then(() => {
    const server = app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port} in ${config.nodeEnv} mode`);
    });

    // Graceful shutdown on SIGTERM (Cloud Run container contract)
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed cleanly');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('[startup] Fatal error during seed:', err);
    process.exit(1);
  });
