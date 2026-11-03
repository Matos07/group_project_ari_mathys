import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('F-04: Opening Balance Recording (FR-11, BR-02, BR-12, D-14)', () => {
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

  it('TEST-F04-01 / AC-F04-01: Post valid opening balance to Main Bank (Cash account) and verify derived balance', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;

    const payload = {
      accountId: bank.id,
      amountMinor: 5000000, // 50,000.00 THB in satang
      date: '2026-10-23',
      description: 'Initial bank deposit'
    };

    const res = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.id).toBeDefined();
    expect(res.body.transaction.kind).toBe('OPENING_BALANCE');
    expect(res.body.transaction.mainAccountId).toBe(bank.id);
    expect(res.body.transaction.totalMinor).toBe(5000000);
    expect(res.body.transaction.transactionDate).toBe('2026-10-23');
    expect(res.body.transaction.description).toBe('Initial bank deposit');

    // Verify opening balance transaction has zero allocation lines in database (D-08, D-14)
    const lines = await prisma.allocationLine.findMany({
      where: { transactionId: res.body.transaction.id }
    });
    expect(lines.length).toBe(0);

    // Verify subsequent account overview query reflects 50,000.00 THB balance
    const accountsRes = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    expect(accountsRes.status).toBe(200);
    const updatedBank = accountsRes.body.accounts.find((a: any) => a.id === bank.id);
    expect(updatedBank.balanceMinor).toBe(5000000);
    expect(updatedBank.balanceFormatted).toBe('฿50,000.00');
    expect(updatedBank.hasOpeningBalance).toBe(true);
    expect(accountsRes.body.summary.totalCashMinor).toBe(5000000);
    expect(accountsRes.body.summary.totalCashFormatted).toBe('฿50,000.00');
  });

  it('TEST-F04-02 / AC-F04-02: Reject opening balance targeting Expense or Income account with 422 INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const diningExpense = accounts.find((a) => a.name === 'Dining')!;
    const salaryIncome = accounts.find((a) => a.name === 'Salary')!;

    // 1. Attempt on Expense account
    const expenseRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: diningExpense.id,
        amountMinor: 100000,
        date: '2026-10-23',
        description: 'Invalid expense opening'
      });

    expect(expenseRes.status).toBe(422);
    expect(expenseRes.body.error).toBeDefined();
    expect(expenseRes.body.error.code).toBe('INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE');
    expect(expenseRes.body.error.message).toContain('Cash, Loan Taken, or Loan Given');

    // 2. Attempt on Income account
    const incomeRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: salaryIncome.id,
        amountMinor: 200000,
        date: '2026-10-23',
        description: 'Invalid income opening'
      });

    expect(incomeRes.status).toBe(422);
    expect(incomeRes.body.error).toBeDefined();
    expect(incomeRes.body.error.code).toBe('INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE');
  });

  it('TEST-F04-03 / AC-F04-03: Reject duplicate opening balance on the same account with 422 OPENING_BALANCE_EXISTS', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;

    // 1. First opening balance should succeed
    const firstRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 5000000,
        date: '2026-10-23',
        description: 'First initial balance'
      });

    expect(firstRes.status).toBe(201);

    // 2. Second opening balance on the same account must be rejected with 422
    const secondRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 3000000,
        date: '2026-10-24',
        description: 'Second opening balance attempt'
      });

    expect(secondRes.status).toBe(422);
    expect(secondRes.body.error).toBeDefined();
    expect(secondRes.body.error.code).toBe('OPENING_BALANCE_EXISTS');
    expect(secondRes.body.error.message).toContain('already been recorded');
  });

  it('TEST-F04-04 / AC-F04-04: Reject negative, zero, non-integer, or exceeding maximum amount with 400 Bad Request', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;

    // Zero amount
    const zeroRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 0,
        date: '2026-10-23'
      });

    expect(zeroRes.status).toBe(400);
    expect(zeroRes.body.error.code).toBe('INVALID_AMOUNT');

    // Negative amount
    const negativeRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: -100,
        date: '2026-10-23'
      });

    expect(negativeRes.status).toBe(400);
    expect(negativeRes.body.error.code).toBe('INVALID_AMOUNT');

    // Fractional amount (must be integer satang)
    const floatRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 100.5,
        date: '2026-10-23'
      });

    expect(floatRes.status).toBe(400);
    expect(floatRes.body.error.code).toBe('INVALID_AMOUNT');

    // Amount exceeding ceiling 1,000,000,000 satang (BR-02)
    const maxRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 1000000001,
        date: '2026-10-23'
      });

    expect(maxRes.status).toBe(400);
    expect(maxRes.body.error.code).toBe('AMOUNT_EXCEEDS_MAX');

    // Missing accountId
    const missingAccRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        amountMinor: 50000,
        date: '2026-10-23'
      });

    expect(missingAccRes.status).toBe(400);
    expect(missingAccRes.body.error.code).toBe('INVALID_INPUT');

    // Invalid date format
    const badDateRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 50000,
        date: 'invalid-date'
      });

    expect(badDateRes.status).toBe(400);
    expect(badDateRes.body.error.code).toBe('INVALID_DATE');
  });

  it('TEST-F04-05 / AC-F04-05: Opening balance is strictly isolated from income and expense summaries (BR-05, D-14)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;

    // 1. Record 50,000.00 THB opening balance
    const obRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 5000000,
        date: '2026-10-23',
        description: '50k opening deposit'
      });

    expect(obRes.status).toBe(201);

    // 2. Query income & expense summary endpoint
    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.incomeMinor).toBe(0);
    expect(summaryRes.body.incomeFormatted).toBe('฿0.00');
    expect(summaryRes.body.expenseMinor).toBe(0);
    expect(summaryRes.body.expenseFormatted).toBe('฿0.00');
    expect(summaryRes.body.netMinor).toBe(0);
    expect(summaryRes.body.netFormatted).toBe('฿0.00');
  });

  it('allows opening balances on Loan Taken and Loan Given accounts', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const creditCard = accounts.find((a) => a.name === 'Credit Card')!;
    const personalLoan = accounts.find((a) => a.name === 'Personal Loan')!;

    // 1. Opening balance on Credit Card (LOAN_TAKEN) -> debt increases
    const cardRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: creditCard.id,
        amountMinor: 1500000, // 15,000.00 THB debt
        date: '2026-10-20',
        description: 'Credit card previous balance'
      });

    expect(cardRes.status).toBe(201);
    expect(cardRes.body.transaction.kind).toBe('OPENING_BALANCE');
    expect(cardRes.body.transaction.totalMinor).toBe(1500000);

    // 2. Opening balance on Personal Loan (LOAN_GIVEN) -> receivable increases
    const loanRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: personalLoan.id,
        amountMinor: 800000, // 8,000.00 THB receivable
        date: '2026-10-21',
        description: 'Existing loan to friend'
      });

    expect(loanRes.status).toBe(201);
    expect(loanRes.body.transaction.kind).toBe('OPENING_BALANCE');
    expect(loanRes.body.transaction.totalMinor).toBe(800000);

    // Check account balances
    const overviewRes = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.summary.totalDebtMinor).toBe(1500000);
    expect(overviewRes.body.summary.totalDebtFormatted).toBe('฿15,000.00');
    expect(overviewRes.body.summary.totalReceivableMinor).toBe(800000);
    expect(overviewRes.body.summary.totalReceivableFormatted).toBe('฿8,000.00');
  });

  it('enforces privacy isolation (BR-10, D-15): cannot set opening balance on another user account', async () => {
    const { cookie: user1Cookie } = await loginAs('demo.user1@example.test');
    const { user: user2 } = await loginAs('demo.user2@example.test');

    const user2Accounts = await prisma.account.findMany({ where: { userId: user2.id } });
    const user2Bank = user2Accounts.find((a) => a.name === 'Main Bank Account')!;

    // User 1 attempts to record opening balance on User 2's bank account
    const crossRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', user1Cookie)
      .send({
        accountId: user2Bank.id,
        amountMinor: 5000000,
        date: '2026-10-23'
      });

    expect(crossRes.status).toBe(404);
    expect(crossRes.body.error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('rejects unauthenticated requests (401) and administrator requests (403)', async () => {
    const user1Accounts = await prisma.account.findMany();
    const targetAccount = user1Accounts[0];

    // 1. Unauthenticated request
    const unauthRes = await request(app)
      .post('/api/transactions/opening-balance')
      .send({
        accountId: targetAccount.id,
        amountMinor: 100000
      });

    expect(unauthRes.status).toBe(401);

    // 2. Administrator role request (BR-16)
    const { cookie: adminCookie } = await loginAs('demo.admin@example.test');
    const adminRes = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', adminCookie)
      .send({
        accountId: targetAccount.id,
        amountMinor: 100000
      });

    expect(adminRes.status).toBe(403);
  });

  it('serves overview page containing the opening balance UI modal and controls', async () => {
    const { cookie } = await loginAs('demo.user1@example.test');

    const res = await request(app)
      .get('/overview')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain('openingBalanceModal');
    expect(res.text).toContain('Record Opening Balance');
    expect(res.text).toContain('modalAmountBaht');
    expect(res.text).toContain('satangPreviewText');
    expect(res.text).toContain('/api/transactions/opening-balance');
  });
});

