import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('F-07: Transaction History and Income/Expense Summary (FR-21, FR-22, BR-05, BR-10, NFR-10)', () => {
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

  it('TEST-F07-01 / AC-F07-01: Paginated transaction history listing sorted descending by createdAt', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;

    // Create 25 transactions sequentially
    for (let i = 1; i <= 25; i++) {
      await request(app)
        .post('/api/transactions/receipt')
        .set('Cookie', cookie)
        .send({
          mainAccountId: bank.id,
          totalMinor: 1000 * i,
          transactionDate: '2026-10-23',
          description: `Transaction #${i}`,
          allocations: [{ targetAccountId: salary.id, amountMinor: 1000 * i, memo: `Memo ${i}` }]
        });
    }

    // Request page 1 with pageSize 20
    const resPage1 = await request(app)
      .get('/api/transactions?page=1&pageSize=20')
      .set('Cookie', cookie);

    expect(resPage1.status).toBe(200);
    expect(resPage1.body.transactions).toHaveLength(20);
    expect(resPage1.body.pagination).toBeDefined();
    expect(resPage1.body.pagination.page).toBe(1);
    expect(resPage1.body.pagination.pageSize).toBe(20);
    expect(resPage1.body.pagination.totalCount).toBe(25);
    expect(resPage1.body.pagination.totalPages).toBe(2);

    // Verify ordering: newest first (Transaction #25 should be first)
    expect(resPage1.body.transactions[0].description).toBe('Transaction #25');
    expect(resPage1.body.transactions[19].description).toBe('Transaction #6');

    // Request page 2 with pageSize 20 -> should return remaining 5
    const resPage2 = await request(app)
      .get('/api/transactions?page=2&pageSize=20')
      .set('Cookie', cookie);

    expect(resPage2.status).toBe(200);
    expect(resPage2.body.transactions).toHaveLength(5);
    expect(resPage2.body.pagination.page).toBe(2);
    expect(resPage2.body.transactions[4].description).toBe('Transaction #1');
  });

  it('TEST-F07-02 / AC-F07-02: Transaction allocation line visibility and single transaction detail query', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const card = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;
    const groceries = accounts.find((a) => a.name === 'Groceries')!;

    // Create a transaction with 2 allocation lines
    const createRes = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: card.id,
        totalMinor: 120000,
        transactionDate: '2026-10-23',
        description: 'Multi-line expense',
        allocations: [
          { targetAccountId: dining.id, amountMinor: 80000, memo: 'Dinner out' },
          { targetAccountId: groceries.id, amountMinor: 40000, memo: 'Supermarket' }
        ]
      });

    expect(createRes.status).toBe(201);
    const txId = createRes.body.transaction.id;

    // 1. In list endpoint, verify allocation records with target names and formats
    const listRes = await request(app)
      .get('/api/transactions')
      .set('Cookie', cookie);

    expect(listRes.status).toBe(200);
    const listedTx = listRes.body.transactions.find((t: any) => t.id === txId);
    expect(listedTx).toBeDefined();
    expect(listedTx.mainAccountName).toBe('Credit Card');
    expect(listedTx.totalFormatted).toBe('฿1,200.00');
    expect(listedTx.allocations).toHaveLength(2);
    expect(listedTx.allocations[0].targetAccountName).toBeDefined();
    expect(listedTx.allocations[0].amountFormatted).toBeDefined();

    // 2. Query single transaction detail endpoint GET /api/transactions/:id
    const detailRes = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Cookie', cookie);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.transaction).toBeDefined();
    expect(detailRes.body.transaction.id).toBe(txId);
    expect(detailRes.body.transaction.mainAccountName).toBe('Credit Card');
    expect(detailRes.body.transaction.totalFormatted).toBe('฿1,200.00');
    expect(detailRes.body.transaction.allocations).toHaveLength(2);

    const targetNames = detailRes.body.transaction.allocations.map((a: any) => a.targetAccountName);
    expect(targetNames).toContain('Dining');
    expect(targetNames).toContain('Groceries');
  });

  it('TEST-F07-03 / AC-F07-03: Full SRS 4.4 worked example sequence verification', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const card = accounts.find((a) => a.name === 'Credit Card')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;
    const groceries = accounts.find((a) => a.name === 'Groceries')!;

    // Step 1: Opening balance 50,000.00 THB on Bank (5,000,000 satang)
    const step1 = await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 5000000, date: '2026-10-20', description: 'Opening balance' });
    expect(step1.status).toBe(201);

    // Step 2: Receive 30,000.00 THB into Bank, line: Income "Salary" 30,000.00 THB (3,000,000 satang)
    const step2 = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 3000000,
        transactionDate: '2026-10-21',
        description: 'October Salary',
        allocations: [{ targetAccountId: salary.id, amountMinor: 3000000, memo: 'Base salary' }]
      });
    expect(step2.status).toBe(201);

    // Step 3: Charge 1,200.00 THB on Credit Card, lines: Dining 800.00 + Groceries 400.00 (120,000 satang)
    const step3 = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: card.id,
        totalMinor: 120000,
        transactionDate: '2026-10-22',
        description: 'Supermarket and restaurant',
        allocations: [
          { targetAccountId: dining.id, amountMinor: 80000, memo: 'Dinner' },
          { targetAccountId: groceries.id, amountMinor: 40000, memo: 'Groceries' }
        ]
      });
    expect(step3.status).toBe(201);

    // Step 4: Pay 700.00 THB from Bank, line: Credit Card repayment 700.00 THB (70,000 satang)
    const step4 = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 70000,
        transactionDate: '2026-10-23',
        description: 'Card partial repayment',
        allocations: [{ targetAccountId: card.id, amountMinor: 70000, memo: 'Repayment' }]
      });
    expect(step4.status).toBe(201);

    // Verify Account Balances per SRS 4.4:
    // Bank: 50,000 + 30,000 - 700 = 79,300.00 THB (7,930,000 satang)
    // Credit Card debt: 1,200 - 700 = 500.00 THB (50,000 satang)
    const accountsRes = await request(app)
      .get('/api/accounts')
      .set('Cookie', cookie);

    const updatedBank = accountsRes.body.accounts.find((a: any) => a.id === bank.id);
    const updatedCard = accountsRes.body.accounts.find((a: any) => a.id === card.id);
    expect(updatedBank.balanceMinor).toBe(7930000);
    expect(updatedBank.balanceFormatted).toBe('฿79,300.00');
    expect(updatedCard.balanceMinor).toBe(50000);
    expect(updatedCard.balanceFormatted).toBe('฿500.00');

    // Verify Income & Expense Summary per SRS 4.4:
    // Income = 30,000.00 THB, Expense = 1,200.00 THB, Net = 28,800.00 THB
    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.incomeMinor).toBe(3000000);
    expect(summaryRes.body.incomeFormatted).toBe('฿30,000.00');
    expect(summaryRes.body.expenseMinor).toBe(120000);
    expect(summaryRes.body.expenseFormatted).toBe('฿1,200.00');
    expect(summaryRes.body.netMinor).toBe(2880000);
    expect(summaryRes.body.netFormatted).toBe('฿28,800.00');
  });

  it('TEST-F07-04 / AC-F07-04: Loan/card repayment is excluded from expense total (BR-05)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const card = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    // Initial cash
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 1000000, date: '2026-10-20' });

    // Charge 1,000.00 THB
    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: card.id,
        totalMinor: 100000,
        transactionDate: '2026-10-21',
        allocations: [{ targetAccountId: dining.id, amountMinor: 100000 }]
      });

    // Check expense before repayment = 1,000.00 THB
    const beforeRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);
    expect(beforeRes.body.expenseMinor).toBe(100000);

    // Repay 700.00 THB to card
    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 70000,
        transactionDate: '2026-10-22',
        allocations: [{ targetAccountId: card.id, amountMinor: 70000 }]
      });

    // Check expense after repayment: must still be 1,000.00 THB (repayment excluded, BR-05)
    const afterRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);
    expect(afterRes.body.expenseMinor).toBe(100000);
  });

  it('TEST-F07-05 / AC-F07-05: Opening balances are excluded from income and expense summaries (BR-05)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const card = accounts.find((a) => a.name === 'Credit Card')!;

    // Record 50,000.00 THB opening balance on Bank and 10,000.00 THB on Card
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 5000000, date: '2026-10-20' });

    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: card.id, amountMinor: 1000000, date: '2026-10-20' });

    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.incomeMinor).toBe(0);
    expect(summaryRes.body.expenseMinor).toBe(0);
    expect(summaryRes.body.netMinor).toBe(0);
  });

  it('TEST-F07-06 / AC-F07-06: Strict cross-user privacy isolation on history and details (BR-10, D-15)', async () => {
    const { cookie: user1Cookie, user: user1 } = await loginAs('demo.user1@example.test');
    const { cookie: user2Cookie, user: user2 } = await loginAs('demo.user2@example.test');

    const user1Accounts = await prisma.account.findMany({ where: { userId: user1.id } });
    const user2Accounts = await prisma.account.findMany({ where: { userId: user2.id } });

    const user1Bank = user1Accounts.find((a) => a.name === 'Main Bank Account')!;
    const user1Salary = user1Accounts.find((a) => a.name === 'Salary')!;
    const user2Bank = user2Accounts.find((a) => a.name === 'Main Bank Account')!;
    const user2Salary = user2Accounts.find((a) => a.name === 'Salary')!;

    // User 1 creates a transaction
    const u1TxRes = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', user1Cookie)
      .send({
        mainAccountId: user1Bank.id,
        totalMinor: 100000,
        transactionDate: '2026-10-23',
        description: 'User 1 Salary',
        allocations: [{ targetAccountId: user1Salary.id, amountMinor: 100000 }]
      });

    // User 2 creates a transaction
    const u2TxRes = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', user2Cookie)
      .send({
        mainAccountId: user2Bank.id,
        totalMinor: 200000,
        transactionDate: '2026-10-23',
        description: 'User 2 Salary',
        allocations: [{ targetAccountId: user2Salary.id, amountMinor: 200000 }]
      });

    const u1TxId = u1TxRes.body.transaction.id;
    const u2TxId = u2TxRes.body.transaction.id;

    // 1. User 1 listing should contain User 1's transaction, but NOT User 2's
    const u1ListRes = await request(app)
      .get('/api/transactions')
      .set('Cookie', user1Cookie);

    expect(u1ListRes.status).toBe(200);
    const u1ListIds = u1ListRes.body.transactions.map((t: any) => t.id);
    expect(u1ListIds).toContain(u1TxId);
    expect(u1ListIds).not.toContain(u2TxId);

    // 2. User 1 requesting User 2's transaction detail directly returns 404 (BR-10, D-15)
    const crossRes = await request(app)
      .get(`/api/transactions/${u2TxId}`)
      .set('Cookie', user1Cookie);

    expect(crossRes.status).toBe(404);
    expect(crossRes.body.error).toBeDefined();
    expect(crossRes.body.error.code).toBe('TRANSACTION_NOT_FOUND');
  });

  it('rejects unauthenticated requests with 401 and administrators with 403 (BR-16)', async () => {
    // 1. Unauthenticated -> 401
    const unauthRes = await request(app).get('/api/transactions');
    expect(unauthRes.status).toBe(401);

    const unauthSummaryRes = await request(app).get('/api/summary/income-expense');
    expect(unauthSummaryRes.status).toBe(401);

    // 2. Administrator -> 403
    const { cookie: adminCookie } = await loginAs('demo.admin@example.test');

    const adminTxRes = await request(app)
      .get('/api/transactions')
      .set('Cookie', adminCookie);
    expect(adminTxRes.status).toBe(403);

    const adminSummaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', adminCookie);
    expect(adminSummaryRes.status).toBe(403);
  });

  it('serves overview page containing the transaction history table and summary cards (NFR-10)', async () => {
    const { cookie } = await loginAs('demo.user1@example.test');

    const res = await request(app)
      .get('/overview')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain('historyTable');
    expect(res.text).toContain('Transaction History');
    expect(res.text).toContain('incomeExpenseSummary');
    expect(res.text).toContain('summaryIncome');
    expect(res.text).toContain('summaryExpense');
    expect(res.text).toContain('summaryNet');
    expect(res.text).toContain('/api/transactions');
    expect(res.text).toContain('/api/summary/income-expense');
  });
});

