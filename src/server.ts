import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

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
