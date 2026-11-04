import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('F-05: Receive Money Transactions (FR-13, BR-01, BR-03, BR-04, BR-09, BR-11, NFR-03)', () => {
  const app = createApp();
  const testPassword = 'Password123!';

  beforeEach(async () => {
    // Clean up transactions and seed database fresh before each test
    await prisma.allocationLine.deleteMany({});
    await prisma.transaction.deleteMany({});
    await seedDatabase(prisma, testPassword);
  });

  async function loginAs(email: string) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: testPassword });
    const cookie = res.headers['set-cookie'];
    return { cookie, user: res.body.user };
  }

  it('TEST-F05-01 / AC-F05-01: Valid receipt with single income line — 201 Created, bank balance increases, income increases', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;

    // First set an opening balance so bank has funds context
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 5000000, date: '2026-10-20' });

    const payload = {
      mainAccountId: bank.id,
      totalMinor: 3000000, // 30,000.00 THB
      transactionDate: '2026-10-23',
      description: 'October Monthly Salary',
      allocations: [
        {
          targetAccountId: salary.id,
          amountMinor: 3000000,
          memo: 'Base salary'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.id).toBeDefined();
    expect(res.body.transaction.kind).toBe('RECEIPT');
    expect(res.body.transaction.totalMinor).toBe(3000000);
    expect(res.body.transaction.transactionDate).toBe('2026-10-23');
    expect(res.body.transaction.description).toBe('October Monthly Salary');
    expect(res.body.transaction.allocations).toHaveLength(1);
    expect(res.body.transaction.allocations[0].targetAccountId).toBe(salary.id);
    expect(res.body.transaction.allocations[0].amountMinor).toBe(3000000);
    expect(res.body.transaction.allocations[0].memo).toBe('Base salary');

    // Verify bank balance increased by 30k (50k opening + 30k receipt = 80k)
    const accountsRes = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    const updatedBank = accountsRes.body.accounts.find((a: any) => a.id === bank.id);
    expect(updatedBank.balanceMinor).toBe(8000000); // 50k + 30k

    // Verify income summary shows the 30k salary
    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.body.incomeMinor).toBe(3000000);
  });

  it('TEST-F05-02 / AC-F05-02: Valid receipt with multiple income lines — 201, all lines stored, total matches', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;
    const interest = accounts.find((a) => a.name === 'Interest')!;

    const payload = {
      mainAccountId: bank.id,
      totalMinor: 1500000, // 15,000.00 THB
      transactionDate: '2026-10-23',
      description: 'October income',
      allocations: [
        {
          targetAccountId: salary.id,
          amountMinor: 1000000,
          memo: 'Salary portion'
        },
        {
          targetAccountId: interest.id,
          amountMinor: 500000,
          memo: 'Interest portion'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.transaction.allocations).toHaveLength(2);

    // Verify both lines are stored correctly
    const lineAmounts = res.body.transaction.allocations.map((l: any) => l.amountMinor).sort((a: number, b: number) => a - b);
    expect(lineAmounts).toEqual([500000, 1000000]);

    // Verify total matches sum
    const sum = res.body.transaction.allocations.reduce((s: number, l: any) => s + l.amountMinor, 0);
    expect(sum).toBe(1500000);
    expect(sum).toBe(res.body.transaction.totalMinor);
  });

  it('TEST-F05-03 / AC-F05-03: Allocation sum mismatch — 422 ALLOCATION_SUM_MISMATCH', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;

    const payload = {
      mainAccountId: bank.id,
      totalMinor: 3000000, // 30,000 THB
      transactionDate: '2026-10-23',
      description: 'Mismatched receipt',
      allocations: [
        {
          targetAccountId: salary.id,
          amountMinor: 2500000, // Only 25,000 THB — mismatch!
          memo: 'Short allocation'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ALLOCATION_SUM_MISMATCH');
  });

  it('TEST-F05-04 / AC-F05-04: Future transaction date — 422 FUTURE_DATE_DISALLOWED', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;

    // Use a date far in the future to avoid timezone edge cases
    const futureDate = '2099-12-31';

    const payload = {
      mainAccountId: bank.id,
      totalMinor: 3000000,
      transactionDate: futureDate,
      description: 'Future receipt',
      allocations: [
        {
          targetAccountId: salary.id,
          amountMinor: 3000000,
          memo: 'Future salary'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FUTURE_DATE_DISALLOWED');
  });

  it('TEST-F05-05 / AC-F05-05: Foreign account target — 404 Not Found (BR-10, BR-11)', async () => {
    const { cookie: user1Cookie, user: user1 } = await loginAs('demo.user1@example.test');
    const { user: user2 } = await loginAs('demo.user2@example.test');

    const user1Accounts = await prisma.account.findMany({ where: { userId: user1.id } });
    const user2Accounts = await prisma.account.findMany({ where: { userId: user2.id } });

    const user1Bank = user1Accounts.find((a) => a.name === 'Main Bank Account')!;
    const user2Salary = user2Accounts.find((a) => a.name === 'Salary')!;

    const payload = {
      mainAccountId: user1Bank.id,
      totalMinor: 3000000,
      transactionDate: '2026-10-23',
      description: 'Cross-user receipt',
      allocations: [
        {
          targetAccountId: user2Salary.id, // User 2's account!
          amountMinor: 3000000,
          memo: 'Foreign target'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', user1Cookie)
      .send(payload);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('TEST-F05-06 / AC-F05-06: Atomic rollback on invalid multi-line — zero rows committed (NFR-03)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;

    // Count existing transactions before the attempt
    const beforeCount = await prisma.transaction.count({ where: { userId: user.id } });
    const beforeLineCount = await prisma.allocationLine.count();

    // Send a payload where allocation sum does not match total (invalid)
    const payload = {
      mainAccountId: bank.id,
      totalMinor: 3000000,
      transactionDate: '2026-10-23',
      description: 'Should rollback',
      allocations: [
        {
          targetAccountId: salary.id,
          amountMinor: 1500000,
          memo: 'First line'
        },
        {
          targetAccountId: salary.id,
          amountMinor: 1000000, // Sum = 2,500,000 ≠ 3,000,000
          memo: 'Second line'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(422);

    // Verify zero new rows were committed
    const afterCount = await prisma.transaction.count({ where: { userId: user.id } });
    const afterLineCount = await prisma.allocationLine.count();

    expect(afterCount).toBe(beforeCount);
    expect(afterLineCount).toBe(beforeLineCount);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/transactions/receipt')
      .send({
        mainAccountId: 'some-id',
        totalMinor: 100000,
        transactionDate: '2026-10-23',
        allocations: [{ targetAccountId: 'other-id', amountMinor: 100000 }]
      });

    expect(res.status).toBe(401);
  });

  it('rejects administrator role with 403 (BR-16)', async () => {
    const { cookie: adminCookie } = await loginAs('demo.admin@example.test');

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', adminCookie)
      .send({
        mainAccountId: 'some-id',
        totalMinor: 100000,
        transactionDate: '2026-10-23',
        allocations: [{ targetAccountId: 'other-id', amountMinor: 100000 }]
      });

    expect(res.status).toBe(403);
  });

  it('rejects EXPENSE account as allocation target for RECEIPT with 422 INVALID_ALLOCATION_TARGET', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    const payload = {
      mainAccountId: bank.id,
      totalMinor: 100000,
      transactionDate: '2026-10-23',
      description: 'Invalid target type',
      allocations: [
        {
          targetAccountId: dining.id, // EXPENSE — not valid for RECEIPT
          amountMinor: 100000,
          memo: 'Wrong type'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_ALLOCATION_TARGET');
  });

  it('rejects self-target (main = target) with 422 SELF_TARGET_DISALLOWED (BR-04)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;

    const payload = {
      mainAccountId: bank.id,
      totalMinor: 100000,
      transactionDate: '2026-10-23',
      description: 'Self-target receipt',
      allocations: [
        {
          targetAccountId: bank.id, // Same as main!
          amountMinor: 100000,
          memo: 'Self'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('SELF_TARGET_DISALLOWED');
  });

  it('rejects non-CASH main account for RECEIPT with 422', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const salary = accounts.find((a) => a.name === 'Salary')!; // INCOME type
    const interest = accounts.find((a) => a.name === 'Interest')!;

    const payload = {
      mainAccountId: salary.id, // INCOME — not CASH!
      totalMinor: 100000,
      transactionDate: '2026-10-23',
      description: 'Non-cash main',
      allocations: [
        {
          targetAccountId: interest.id,
          amountMinor: 100000,
          memo: 'Invalid main type'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
  });

  it('serves overview page containing the receive money UI modal and controls (NFR-10)', async () => {
    const { cookie } = await loginAs('demo.user1@example.test');

    const res = await request(app)
      .get('/overview')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain('receiveMoneyModal');
    expect(res.text).toContain('Receive Money');
    expect(res.text).toContain('receiptTotalBaht');
    expect(res.text).toContain('allocationsContainer');
    expect(res.text).toContain('btnAddAllocation');
    expect(res.text).toContain('/api/transactions/receipt');
  });
});

