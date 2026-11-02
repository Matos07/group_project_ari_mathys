import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('TEST-SR02-02 & TEST-SR02-03: Synthetic Seed Pipeline', () => {
  const testSeedPassword = 'ValidTestPassword123!';

  it('TEST-SR02-02: should throw an error when SEED_PASSWORD is empty or undefined', async () => {
    await expect(seedDatabase(prisma, '')).rejects.toThrow(
      'SEED_PASSWORD environment variable is required to run seed.'
    );
  });

  it('TEST-SR02-03: should idempotently create 2 demo users, 1 admin, and default accounts with bcrypt cost 12', async () => {
    // Run seed
    await seedDatabase(prisma, testSeedPassword);

    // Verify Admin
    const admin = await prisma.user.findUnique({
      where: { email: 'demo.admin@example.test' },
      include: { accounts: true }
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('ADMINISTRATOR');
    expect(admin?.isActive).toBe(true);
    // BR-16: Admin owns no financial accounts
    expect(admin?.accounts).toHaveLength(0);
    // NFR-02: Bcrypt cost factor 12
    expect(admin?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(bcrypt.compareSync(testSeedPassword, admin!.passwordHash)).toBe(true);

    // Verify Regular Users
    const userEmails = ['demo.user1@example.test', 'demo.user2@example.test'];

    for (const email of userEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe('USER');
      expect(user?.isActive).toBe(true);
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
      expect(bcrypt.compareSync(testSeedPassword, user!.passwordHash)).toBe(true);

      const accounts = user!.accounts;
      // Expect 10 default accounts per D-17 & SR-02 specification
      expect(accounts).toHaveLength(10);

      // Verify presence of required accounts
      const wallet = accounts.find((a) => a.name === 'Wallet');
      expect(wallet).toBeDefined();
      expect(wallet?.type).toBe('CASH');
      expect(wallet?.subtype).toBe('WALLET');

      const bank = accounts.find((a) => a.name === 'Main Bank Account');
      expect(bank).toBeDefined();
      expect(bank?.type).toBe('CASH');
      expect(bank?.subtype).toBe('BANK');

      const card = accounts.find((a) => a.name === 'Credit Card');
      expect(card).toBeDefined();
      expect(card?.type).toBe('LOAN_TAKEN');
      expect(card?.subtype).toBe('CREDIT_CARD');

      const personalLoan = accounts.find((a) => a.name === 'Personal Loan');
      expect(personalLoan).toBeDefined();
      expect(personalLoan?.type).toBe('LOAN_GIVEN');

      const salary = accounts.find((a) => a.name === 'Salary');
      expect(salary).toBeDefined();
      expect(salary?.type).toBe('INCOME');

      const interest = accounts.find((a) => a.name === 'Interest Earned' || a.name === 'Interest');
      expect(interest).toBeDefined();
      expect(interest?.type).toBe('INCOME');

      const dining = accounts.find((a) => a.name === 'Dining');
      expect(dining).toBeDefined();
      expect(dining?.type).toBe('EXPENSE');

      const groceries = accounts.find((a) => a.name === 'Groceries');
      expect(groceries).toBeDefined();
      expect(groceries?.type).toBe('EXPENSE');

      const electricity = accounts.find((a) => a.name === 'Electricity');
      expect(electricity).toBeDefined();
      expect(electricity?.type).toBe('EXPENSE');

      const telecom = accounts.find((a) => a.name === 'Telecom');
      expect(telecom).toBeDefined();
      expect(telecom?.type).toBe('EXPENSE');
    }

    // Test idempotency: re-running seed should succeed without duplicate record errors
    await expect(seedDatabase(prisma, testSeedPassword)).resolves.not.toThrow();
  });
});
