import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('F-06: Payment and Charge Transactions (FR-14, FR-15, BR-01, BR-03, BR-04, BR-07, BR-08, BR-09, BR-11, NFR-03)', () => {
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

  it('TEST-F06-01 / AC-F06-01: Card purchase with 2 expense lines — 201 Created; Card debt increases, Expenses increase', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;
    const groceries = accounts.find((a) => a.name === 'Groceries')!;

    const payload = {
      mainAccountId: creditCard.id,
      totalMinor: 120000, // 1,200.00 THB
      transactionDate: '2026-10-23',
      description: 'Weekend Supermarket & Dinner',
      allocations: [
        {
          targetAccountId: dining.id,
          amountMinor: 80000,
          memo: 'Restaurant dinner'
        },
        {
          targetAccountId: groceries.id,
          amountMinor: 40000,
          memo: 'Weekly groceries'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.id).toBeDefined();
    expect(res.body.transaction.kind).toBe('PAYMENT');
    expect(res.body.transaction.totalMinor).toBe(120000);
    expect(res.body.transaction.transactionDate).toBe('2026-10-23');
    expect(res.body.transaction.description).toBe('Weekend Supermarket & Dinner');
    expect(res.body.transaction.allocations).toHaveLength(2);

    // Verify card debt increased by 1,200 THB
    const accountsRes = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    const updatedCard = accountsRes.body.accounts.find((a: any) => a.id === creditCard.id);
    expect(updatedCard.balanceMinor).toBe(120000);
    expect(accountsRes.body.summary.totalDebtMinor).toBe(120000);

    // Verify expense summary increased by 1,200 THB
    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.body.expenseMinor).toBe(120000);
    expect(summaryRes.body.netMinor).toBe(-120000);
  });

  it('TEST-F06-02 / AC-F06-02: Credit card repayment from Bank — 201 Created; Bank decreases, Card debt decreases, Expenses unchanged', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    // 1. Give bank an opening balance of 100,000.00 THB
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 10000000, date: '2026-10-20' });

    // 2. Charge 1,000.00 THB on credit card
    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: creditCard.id,
        totalMinor: 100000,
        transactionDate: '2026-10-21',
        allocations: [{ targetAccountId: dining.id, amountMinor: 100000 }]
      });

    // 3. Repay 700.00 THB from Bank to Credit Card
    const repayPayload = {
      mainAccountId: bank.id,
      totalMinor: 70000,
      transactionDate: '2026-10-23',
      description: 'Credit Card partial settlement',
      allocations: [
        {
          targetAccountId: creditCard.id,
          amountMinor: 70000,
          memo: 'Partial repayment'
        }
      ]
    };

    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send(repayPayload);

    expect(res.status).toBe(201);
    expect(res.body.transaction.kind).toBe('PAYMENT');
    expect(res.body.transaction.totalMinor).toBe(70000);

    // Verify balances
    const accountsRes = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    const updatedBank = accountsRes.body.accounts.find((a: any) => a.id === bank.id);
    const updatedCard = accountsRes.body.accounts.find((a: any) => a.id === creditCard.id);

    // Bank was 100,000 - 700 = 99,300 THB (9,930,000 satang)
    expect(updatedBank.balanceMinor).toBe(9930000);
    // Card debt was 1,000 - 700 = 300 THB (30,000 satang)
    expect(updatedCard.balanceMinor).toBe(30000);
    expect(accountsRes.body.summary.totalDebtMinor).toBe(30000);

    // Expenses remain 1,000 THB from the dining charge (repayment does not count as expense, BR-05)
    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.body.expenseMinor).toBe(100000);
  });

  it('TEST-F06-03 / AC-F06-03: Cash overdraft rejection — 422 OVERDRAFT_DISALLOWED (BR-07)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    // Set bank balance to 50,000 satang (500.00 THB)
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 50000, date: '2026-10-20' });

    // Attempt to spend 60,000 satang (600.00 THB) -> overdraft disallowed!
    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 60000,
        transactionDate: '2026-10-23',
        description: 'Overdraft attempt',
        allocations: [{ targetAccountId: dining.id, amountMinor: 60000 }]
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('OVERDRAFT_DISALLOWED');
  });

  it('TEST-F06-04 / AC-F06-04: Excessive debt repayment rejection — 422 REPAYMENT_EXCEEDS_DEBT (BR-08)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    // Bank has plenty of cash (10,000 THB)
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 1000000, date: '2026-10-20' });

    // Card has 500.00 THB debt (50,000 satang)
    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: creditCard.id,
        totalMinor: 50000,
        transactionDate: '2026-10-21',
        allocations: [{ targetAccountId: dining.id, amountMinor: 50000 }]
      });

    // Attempt to repay 600.00 THB (60,000 satang) -> exceeds outstanding debt!
    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 60000,
        transactionDate: '2026-10-23',
        description: 'Excessive repayment',
        allocations: [{ targetAccountId: creditCard.id, amountMinor: 60000 }]
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('REPAYMENT_EXCEEDS_DEBT');
  });

  it('TEST-F06-05 / AC-F06-05: Allocation sum mismatch — 422 ALLOCATION_SUM_MISMATCH (BR-01)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;
    const groceries = accounts.find((a) => a.name === 'Groceries')!;

    // Total is 120,000 satang, but lines sum to 80,000 + 30,000 = 110,000 satang
    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: creditCard.id,
        totalMinor: 120000,
        transactionDate: '2026-10-23',
        allocations: [
          { targetAccountId: dining.id, amountMinor: 80000 },
          { targetAccountId: groceries.id, amountMinor: 30000 }
        ]
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ALLOCATION_SUM_MISMATCH');
  });

  it('TEST-F06-06 / AC-F06-06: Self-target rejection — 422 SELF_TARGET_DISALLOWED (BR-04)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;

    // Main account is Credit Card, and an allocation line targets Credit Card
    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: creditCard.id,
        totalMinor: 50000,
        transactionDate: '2026-10-23',
        allocations: [{ targetAccountId: creditCard.id, amountMinor: 50000 }]
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('SELF_TARGET_DISALLOWED');
  });

  it('TEST-F06-07 / AC-F06-07: Future date rejection — 422 FUTURE_DATE_DISALLOWED (BR-09)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: creditCard.id,
        totalMinor: 50000,
        transactionDate: '2099-12-31',
        allocations: [{ targetAccountId: dining.id, amountMinor: 50000 }]
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FUTURE_DATE_DISALLOWED');
  });

  it('rejects foreign account target with 404 ACCOUNT_NOT_FOUND (BR-10, BR-11)', async () => {
    const { cookie: user1Cookie, user: user1 } = await loginAs('demo.user1@example.test');
    const { user: user2 } = await loginAs('demo.user2@example.test');

    const user1Accounts = await prisma.account.findMany({ where: { userId: user1.id } });
    const user2Accounts = await prisma.account.findMany({ where: { userId: user2.id } });

    const user1Card = user1Accounts.find((a) => a.name === 'Credit Card')!;
    const user2Dining = user2Accounts.find((a) => a.name === 'Dining')!;

    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', user1Cookie)
      .send({
        mainAccountId: user1Card.id,
        totalMinor: 50000,
        transactionDate: '2026-10-23',
        allocations: [{ targetAccountId: user2Dining.id, amountMinor: 50000 }]
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('rejects unauthenticated requests with 401 and administrators with 403 (BR-16)', async () => {
    const user1Accounts = await prisma.account.findMany();
    const card = user1Accounts.find((a) => a.type === 'LOAN_TAKEN')!;
    const dining = user1Accounts.find((a) => a.type === 'EXPENSE')!;

    // 1. Unauthenticated -> 401
    const unauthRes = await request(app)
      .post('/api/transactions/payment')
      .send({
        mainAccountId: card.id,
        totalMinor: 10000,
        transactionDate: '2026-10-23',
        allocations: [{ targetAccountId: dining.id, amountMinor: 10000 }]
      });

    expect(unauthRes.status).toBe(401);

    // 2. Admin -> 403
    const { cookie: adminCookie } = await loginAs('demo.admin@example.test');
    const adminRes = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', adminCookie)
      .send({
        mainAccountId: card.id,
        totalMinor: 10000,
        transactionDate: '2026-10-23',
        allocations: [{ targetAccountId: dining.id, amountMinor: 10000 }]
      });

    expect(adminRes.status).toBe(403);
  });

  it('rejects invalid main account type (e.g. paying from an Expense account) with 422', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const dining = accounts.find((a) => a.name === 'Dining')!; // EXPENSE
    const groceries = accounts.find((a) => a.name === 'Groceries')!;

    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: dining.id,
        totalMinor: 50000,
        transactionDate: '2026-10-23',
        allocations: [{ targetAccountId: groceries.id, amountMinor: 50000 }]
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_MAIN_ACCOUNT_TYPE');
  });

  it('enforces atomic rollback: zero rows committed on invalid transaction payload (NFR-03)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    const beforeTxCount = await prisma.transaction.count({ where: { userId: user.id } });
    const beforeLineCount = await prisma.allocationLine.count();

    // Mismatched total vs lines
    const res = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: creditCard.id,
        totalMinor: 100000,
        transactionDate: '2026-10-23',
        allocations: [
          { targetAccountId: dining.id, amountMinor: 60000 },
          { targetAccountId: dining.id, amountMinor: 20000 } // sum = 80k != 100k
        ]
      });

    expect(res.status).toBe(422);

    const afterTxCount = await prisma.transaction.count({ where: { userId: user.id } });
    const afterLineCount = await prisma.allocationLine.count();

    expect(afterTxCount).toBe(beforeTxCount);
    expect(afterLineCount).toBe(beforeLineCount);
  });

  it('serves overview page containing the payment/charge UI modal and controls (NFR-10)', async () => {
    const { cookie } = await loginAs('demo.user1@example.test');

    const res = await request(app)
      .get('/overview')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain('paymentModal');
    expect(res.text).toContain('Record Payment');
    expect(res.text).toContain('paymentTotalBaht');
    expect(res.text).toContain('paymentAllocationsContainer');
    expect(res.text).toContain('/api/transactions/payment');
  });
});

