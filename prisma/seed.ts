import { config } from '../src/config/env.js';

async function main() {
  if (!config.seedPassword) {
    console.error('Error: SEED_PASSWORD environment variable is required to run seed.');
    process.exit(1);
  }

  console.log('Seed runner placeholder: SEED_PASSWORD validated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
