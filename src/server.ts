import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port} in ${config.nodeEnv} mode`);
});

