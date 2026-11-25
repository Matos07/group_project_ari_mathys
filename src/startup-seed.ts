import { prisma } from './db/client.js';
import bcrypt from 'bcryptjs';
import type { AccountType, AccountSubtype } from '@prisma/client';

/**
 * Ensures demo users exist and their passwords are synced with the
 * current ADMIN_PASSWORD / SESSION_SECRET value from Secret Manager.
 *
 * On Cloud Run the portal maps both env vars from the same secret
 * (sc3de6abc-admin-password):
 *   - Migration job  → ADMIN_PASSWORD, SEED_PASSWORD
 *   - Service        → SESSION_SECRET
 *
 * Calling this on every cold start guarantees the password hash in the
 * database always matches the secret, even if the secret is rotated.
 *
 * Uses upsert — idempotent and safe to call repeatedly.
 */
export async function ensureDemoUsers(): Promise<void> {
  const password = process.env.ADMIN_PASSWORD || process.env.SESSION_SECRET;

  // Skip in local development (default dev secret)
  if (!password || password === 'dev-secret-key-change-in-prod') {
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    // Admin (BR-16: no financial accounts)
    await prisma.user.upsert({
      where: { email: 'demo.admin@example.test' },
      update: { passwordHash, displayName: 'Demo Admin', role: 'ADMINISTRATOR', isActive: true },
      create: { email: 'demo.admin@example.test', passwordHash, displayName: 'Demo Admin', role: 'ADMINISTRATOR', isActive: true },
    });

    // Regular demo users + default accounts
    const demoUsers = [
      { email: 'demo.user1@example.test', displayName: 'User One' },
      { email: 'demo.user2@example.test', displayName: 'User Two' },
    ];

    const defaultAccounts: Array<{ name: string; type: AccountType; subtype: AccountSubtype }> = [
      { name: 'Wallet', type: 'CASH', subtype: 'WALLET' },
      { name: 'Main Bank Account', type: 'CASH', subtype: 'BANK' },
      { name: 'Credit Card', type: 'LOAN_TAKEN', subtype: 'CREDIT_CARD' },
      { name: 'Personal Loan', type: 'LOAN_GIVEN', subtype: 'NONE' },
      { name: 'Salary', type: 'INCOME', subtype: 'NONE' },
      { name: 'Interest', type: 'INCOME', subtype: 'NONE' },
      { name: 'Dining', type: 'EXPENSE', subtype: 'NONE' },
      { name: 'Groceries', type: 'EXPENSE', subtype: 'NONE' },
      { name: 'Electricity', type: 'EXPENSE', subtype: 'NONE' },
      { name: 'Telecom', type: 'EXPENSE', subtype: 'NONE' },
    ];

    for (const u of demoUsers) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { passwordHash, displayName: u.displayName, role: 'USER', isActive: true },
        create: { email: u.email, passwordHash, displayName: u.displayName, role: 'USER', isActive: true },
      });

      for (const acc of defaultAccounts) {
        await prisma.account.upsert({
          where: { userId_name: { userId: user.id, name: acc.name } },
          update: { type: acc.type, subtype: acc.subtype, isActive: true },
          create: { userId: user.id, name: acc.name, type: acc.type, subtype: acc.subtype, isActive: true },
        });
      }
    }

    console.log('[startup-seed] Demo users and accounts synced successfully.');
  } catch (error) {
    // Log but don't crash — the migration job seed is the primary source
    console.error('[startup-seed] Failed to sync demo users:', error);
  }
}
