import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('F-03: Account Overview & Derived Balances', () => {
  const app = createApp();
  const testPassword = 'Password123!';

  beforeEach(async () => {
    // Reset transactions and seed database fresh before each test
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

  it('TEST-F03-01 / AC-F03-01: Authenticated user can retrieve their accounts with derived balances', async () => {
    const { cookie } = await loginAs('demo.user1@example.test');

    const res = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.accounts).toBeDefined();
    expect(Array.isArray(res.body.accounts)).toBe(true);
    expect(res.body.accounts.length).toBe(10);

    const bank = res.body.accounts.find((a: any) => a.name === 'Main Bank Account');
    expect(bank).toBeDefined();
    expect(bank.type).toBe('CASH');
    expect(bank.balanceMinor).toBe(0);
    expect(bank.balanceFormatted).toBe('฿0.00');

    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.totalCashMinor).toBe(0);
    expect(res.body.summary.totalDebtMinor).toBe(0);
    expect(res.body.summary.totalReceivableMinor).toBe(0);
  });

  it('TEST-F03-02 / AC-F03-02: Balance derivation correctly calculates cash balance after opening balance, salary receipt, and card repayment', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const userAccounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = userAccounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = userAccounts.find((a) => a.name === 'Salary')!;
    const card = userAccounts.find((a) => a.name === 'Credit Card')!;

    // 1. Opening balance 50,000.00 THB on Bank (5,000,000 satang)
    await prisma.transaction.create({
      data: {
        userId: user.id,
        kind: 'OPENING_BALANCE',
        mainAccountId: bank.id,
        totalMinor: 5000000,
        transactionDate: '2026-10-23',
        description: 'Initial deposit'
      }
    });

    // 2. Receive 30,000.00 THB into Bank allocated to Salary (3,000,000 satang)
    const receipt = await prisma.transaction.create({
      data: {
        userId: user.id,
        kind: 'RECEIPT',
        mainAccountId: bank.id,
        totalMinor: 3000000,
        transactionDate: '2026-10-24',
        description: 'Monthly salary'
      }
    });
    await prisma.allocationLine.create({
      data: {
        transactionId: receipt.id,
        targetAccountId: salary.id,
        amountMinor: 3000000
      }
    });

    // 3. Pay 700.00 THB from Bank to Credit Card (repayment of 70,000 satang)
    const payment = await prisma.transaction.create({
      data: {
        userId: user.id,
        kind: 'PAYMENT',
        mainAccountId: bank.id,
        totalMinor: 70000,
        transactionDate: '2026-10-25',
        description: 'Credit card bill payment'
      }
    });
    await prisma.allocationLine.create({
      data: {
        transactionId: payment.id,
        targetAccountId: card.id,
        amountMinor: 70000
      }
    });

    // Query accounts endpoint
    const res = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    const bankResult = res.body.accounts.find((a: any) => a.id === bank.id);
    // 50,000 + 30,000 - 700 = 79,300.00 THB = 7,930,000 satang
    expect(bankResult.balanceMinor).toBe(7930000);
    expect(bankResult.balanceFormatted).toBe('฿79,300.00');
    expect(res.body.summary.totalCashMinor).toBe(7930000);
  });

  it('TEST-F03-03 / AC-F03-03: Credit card debt correctly displays charges minus repayments', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const userAccounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = userAccounts.find((a) => a.name === 'Main Bank Account')!;
    const card = userAccounts.find((a) => a.name === 'Credit Card')!;
    const dining = userAccounts.find((a) => a.name === 'Dining')!;
    const groceries = userAccounts.find((a) => a.name === 'Groceries')!;

    // 1. Charge 1,200.00 THB on Credit Card (120,000 satang: 80k dining + 40k groceries)
    const charge = await prisma.transaction.create({
      data: {
        userId: user.id,
        kind: 'PAYMENT',
        mainAccountId: card.id,
        totalMinor: 120000,
        transactionDate: '2026-10-23',
        description: 'Dining and Groceries'
      }
    });
    await prisma.allocationLine.createMany({
      data: [
        { transactionId: charge.id, targetAccountId: dining.id, amountMinor: 80000 },
        { transactionId: charge.id, targetAccountId: groceries.id, amountMinor: 40000 }
      ]
    });

    // 2. Partial repayment: 700.00 THB from Bank to Credit Card (70,000 satang)
    const repayment = await prisma.transaction.create({
      data: {
        userId: user.id,
        kind: 'PAYMENT',
        mainAccountId: bank.id,
        totalMinor: 70000,
        transactionDate: '2026-10-24',
        description: 'Partial card repayment'
      }
    });
    await prisma.allocationLine.create({
      data: {
        transactionId: repayment.id,
        targetAccountId: card.id,
        amountMinor: 70000
      }
    });

    const res = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    const cardResult = res.body.accounts.find((a: any) => a.id === card.id);
    // 1,200 - 700 = 500.00 THB debt = 50,000 satang
    expect(cardResult.balanceMinor).toBe(50000);
    expect(cardResult.balanceFormatted).toBe('฿500.00');
    expect(res.body.summary.totalDebtMinor).toBe(50000);
  });

  it('TEST-F03-04 / AC-F03-04: Strict privacy isolation prevents access to other users accounts', async () => {
    const user1Session = await loginAs('demo.user1@example.test');
    const user2Session = await loginAs('demo.user2@example.test');

    const resUser1 = await request(app)
      .get('/api/accounts')
      .set('Cookie', user1Session.cookie);

    expect(resUser1.status).toBe(200);
    // All returned accounts must belong exclusively to User 1
    for (const acc of resUser1.body.accounts) {
      const dbAcc = await prisma.account.findUnique({ where: { id: acc.id } });
      expect(dbAcc?.userId).toBe(user1Session.user.id);
      expect(dbAcc?.userId).not.toBe(user2Session.user.id);
    }
  });

  it('TEST-F03-05: Administrator receives 403 Forbidden on financial accounts endpoint (BR-16)', async () => {
    const { cookie } = await loginAs('demo.admin@example.test');

    const res = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('TEST-F03-06: Unauthenticated request receives 401 Unauthorized (NFR-01)', async () => {
    const res = await request(app).get('/api/accounts');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});
