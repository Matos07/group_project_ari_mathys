import { PrismaClient, AccountType, AccountSubtype } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma as defaultPrisma } from '../src/db/client.js';
import { config } from '../src/config/env.js';

interface SeedAccountDef {
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
}

const DEFAULT_ACCOUNTS: SeedAccountDef[] = [
  { name: 'Wallet', type: 'CASH', subtype: 'WALLET' },
  { name: 'Main Bank Account', type: 'CASH', subtype: 'BANK' },
  { name: 'Credit Card', type: 'LOAN_TAKEN', subtype: 'CREDIT_CARD' },
  { name: 'Personal Loan', type: 'LOAN_GIVEN', subtype: 'NONE' },
  { name: 'Salary', type: 'INCOME', subtype: 'NONE' },
  { name: 'Interest', type: 'INCOME', subtype: 'NONE' },
  { name: 'Dining', type: 'EXPENSE', subtype: 'NONE' },
  { name: 'Groceries', type: 'EXPENSE', subtype: 'NONE' },
  { name: 'Electricity', type: 'EXPENSE', subtype: 'NONE' },
  { name: 'Telecom', type: 'EXPENSE', subtype: 'NONE' }
];

export async function seedDatabase(client: PrismaClient, seedPassword?: string): Promise<void> {
  const password = (seedPassword !== undefined
    ? seedPassword
    : (process.env.SEED_PASSWORD || process.env.ADMIN_PASSWORD || process.env.SESSION_SECRET || config.seedPassword || 'ChangeMeInLocalTesting123!')).trim();

  if (!password || password === '') {
    throw new Error('SEED_PASSWORD environment variable is required to run seed.');
  }

  // Cost factor 12 per NFR-02 & D-03
  const passwordHash = await bcrypt.hash(password, 12);

  // 1. Seed Administrator (BR-16: Admin holds no financial accounts)
  await client.user.upsert({
    where: { email: 'demo.admin@example.test' },
    update: {
      passwordHash,
      displayName: 'Demo Admin',
      role: 'ADMINISTRATOR',
      isActive: true
    },
    create: {
      email: 'demo.admin@example.test',
      passwordHash,
      displayName: 'Demo Admin',
      role: 'ADMINISTRATOR',
      isActive: true
    }
  });

  // 2. Seed Regular Users (D-17)
  const usersToSeed = [
    { email: 'demo.user1@example.test', displayName: 'User One' },
    { email: 'demo.user2@example.test', displayName: 'User Two' }
  ];

  for (const u of usersToSeed) {
    const user = await client.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        displayName: u.displayName,
        role: 'USER',
        isActive: true
      },
      create: {
        email: u.email,
        passwordHash,
        displayName: u.displayName,
        role: 'USER',
        isActive: true
      }
    });

    // 3. Seed Default Accounts per User (D-17, SRS 4.1)
    for (const acc of DEFAULT_ACCOUNTS) {
      await client.account.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: acc.name
          }
        },
        update: {
          type: acc.type,
          subtype: acc.subtype,
          isActive: true
        },
        create: {
          userId: user.id,
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          isActive: true
        }
      });
    }
  }
}

// Auto-run if executed directly as a script
async function runCli() {
  try {
    const password = process.env.SEED_PASSWORD !== undefined ? process.env.SEED_PASSWORD : config.seedPassword;
    await seedDatabase(defaultPrisma, password);
    console.log('Database seeded successfully with synthetic demo users and accounts.');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Seed failed: ${error.message}`);
    } else {
      console.error('Seed failed with unknown error:', error);
    }
    process.exit(1);
  } finally {
    await defaultPrisma.$disconnect();
  }
}

// Check if running directly via tsx/node
const isDirectRun = process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js');
if (isDirectRun) {
  runCli();
}
