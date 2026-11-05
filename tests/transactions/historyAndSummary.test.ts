import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('F-07: Transaction History & Income/Expense Summary (FR-21, FR-22, BR-05, BR-10, NFR-10)', () => {
  const app = createApp();
  const testPassword = 'Password123!';

  beforeEach(async () => {
    // Clean up transactions and seed fresh demo data
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

  it('TEST-F07-01 / AC-F07-01: Paginated transaction history listing ordered newest first', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;

    // Create 25 transactions sequentially
    for (let i = 1; i <= 25; i++) {
      const res = await request(app)
        .post('/api/transactions/receipt')
        .set('Cookie', cookie)
        .send({
          mainAccountId: bank.id,
          totalMinor: 10000 * i,
          transactionDate: '2026-10-15',
          description: `Transaction #${i}`,
          allocations: [
            {
              targetAccountId: salary.id,
              amountMinor: 10000 * i,
              memo: `Line memo ${i}`
            }
          ]
        });
      expect(res.status).toBe(201);
    }

    // 1. Request page 1 with pageSize 20
    const page1Res = await request(app)
      .get('/api/transactions?page=1&pageSize=20')
      .set('Cookie', cookie);

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.transactions).toBeDefined();
    expect(Array.isArray(page1Res.body.transactions)).toBe(true);
    expect(page1Res.body.transactions.length).toBe(20);

    // Verify pagination metadata
    expect(page1Res.body.pagination).toEqual({
      page: 1,
      pageSize: 20,
      totalCount: 25,
      totalPages: 2
    });

    // Verify ordering: newest first (Transaction #25 should be first)
    expect(page1Res.body.transactions[0].description).toBe('Transaction #25');
    expect(page1Res.body.transactions[19].description).toBe('Transaction #6');

    // 2. Request page 2 with pageSize 20
    const page2Res = await request(app)
      .get('/api/transactions?page=2&pageSize=20')
      .set('Cookie', cookie);

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.transactions.length).toBe(5);
    expect(page2Res.body.pagination).toEqual({
      page: 2,
      pageSize: 20,
      totalCount: 25,
      totalPages: 2
    });
    expect(page2Res.body.transactions[0].description).toBe('Transaction #5');
    expect(page2Res.body.transactions[4].description).toBe('Transaction #1');
  });

  it('TEST-F07-02 / AC-F07-02: Transaction allocation line visibility and detail retrieval', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const card = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;
    const groceries = accounts.find((a) => a.name === 'Groceries')!;

    // Create multi-line payment transaction
    const createRes = await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: card.id,
        totalMinor: 120000,
        transactionDate: '2026-10-23',
        description: 'Supermarket and restaurant run',
        allocations: [
          { targetAccountId: dining.id, amountMinor: 80000, memo: 'Lunch with colleagues' },
          { targetAccountId: groceries.id, amountMinor: 40000, memo: 'Weekly groceries' }
        ]
      });

    expect(createRes.status).toBe(201);
    const txId = createRes.body.transaction.id;

    // 1. Query history list
    const listRes = await request(app)
      .get('/api/transactions')
      .set('Cookie', cookie);

    expect(listRes.status).toBe(200);
    const foundTx = listRes.body.transactions.find((t: any) => t.id === txId);
    expect(foundTx).toBeDefined();
    expect(foundTx.mainAccountName).toBe('Credit Card');
    expect(foundTx.totalMinor).toBe(120000);
    expect(foundTx.totalFormatted).toBe('฿1,200.00');
    expect(foundTx.allocations.length).toBe(2);

    expect(foundTx.allocations[0].targetAccountName).toBe('Dining');
    expect(foundTx.allocations[0].targetAccountType).toBe('EXPENSE');
    expect(foundTx.allocations[0].amountMinor).toBe(80000);
    expect(foundTx.allocations[0].amountFormatted).toBe('฿800.00');
    expect(foundTx.allocations[0].memo).toBe('Lunch with colleagues');

    expect(foundTx.allocations[1].targetAccountName).toBe('Groceries');
    expect(foundTx.allocations[1].targetAccountType).toBe('EXPENSE');
    expect(foundTx.allocations[1].amountMinor).toBe(40000);
    expect(foundTx.allocations[1].amountFormatted).toBe('฿400.00');
    expect(foundTx.allocations[1].memo).toBe('Weekly groceries');

    // 2. Query specific transaction detail by ID
    const detailRes = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Cookie', cookie);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.transaction.id).toBe(txId);
    expect(detailRes.body.transaction.allocations.length).toBe(2);
  });

  it('TEST-F07-03 / AC-F07-03: Income and expense summary calculates exact SRS 4.4 worked example figures', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const card = accounts.find((a) => a.name === 'Credit Card')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;
    const groceries = accounts.find((a) => a.name === 'Groceries')!;

    // Step 1: Opening balance 50,000.00 THB on Bank (5,000,000 satang)
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 5000000,
        date: '2026-10-23',
        description: 'Opening balance deposit'
      });

    // Step 2: Receive 30,000.00 THB into Bank allocated to Salary (3,000,000 satang)
    await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 3000000,
        transactionDate: '2026-10-24',
        description: 'Monthly salary receipt',
        allocations: [{ targetAccountId: salary.id, amountMinor: 3000000, memo: 'October Salary' }]
      });

    // Step 3: Charge 1,200.00 THB on Credit Card (Dining 800.00 + Groceries 400.00 = 120,000 satang)
    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: card.id,
        totalMinor: 120000,
        transactionDate: '2026-10-25',
        description: 'Dinner and food market',
        allocations: [
          { targetAccountId: dining.id, amountMinor: 80000, memo: 'Dinner with friends' },
          { targetAccountId: groceries.id, amountMinor: 40000, memo: 'Food shopping' }
        ]
      });

    // Step 4: Pay 700.00 THB from Bank to Credit Card (repayment of 70,000 satang)
    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 70000,
        transactionDate: '2026-10-26',
        description: 'Credit card bill repayment',
        allocations: [{ targetAccountId: card.id, amountMinor: 70000, memo: 'Card partial repayment' }]
      });

    // Query income & expense summary
    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body).toEqual({
      incomeMinor: 3000000,
      incomeFormatted: '฿30,000.00',
      expenseMinor: 120000,
      expenseFormatted: '฿1,200.00',
      netMinor: 2880000,
      netFormatted: '฿28,800.00'
    });
  });

  it('TEST-F07-04 / AC-F07-04: Exclusion of loan repayments from expense totals (BR-05)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const card = accounts.find((a) => a.name === 'Credit Card')!;
    const dining = accounts.find((a) => a.name === 'Dining')!;

    // 1. Initial balance & dining expense of 1,000.00 THB (100,000 satang)
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({ accountId: bank.id, amountMinor: 500000, date: '2026-10-20' });

    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: card.id,
        totalMinor: 100000,
        transactionDate: '2026-10-21',
        description: 'Dining expense',
        allocations: [{ targetAccountId: dining.id, amountMinor: 100000 }]
      });

    // Check summary before repayment
    const beforeRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);
    expect(beforeRes.body.expenseMinor).toBe(100000);

    // 2. Perform 700.00 THB debt repayment (70,000 satang)
    await request(app)
      .post('/api/transactions/payment')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 70000,
        transactionDate: '2026-10-22',
        description: 'Card repayment',
        allocations: [{ targetAccountId: card.id, amountMinor: 70000 }]
      });

    // Check summary after repayment: expenseMinor must remain 100,000 satang!
    const afterRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);
    expect(afterRes.body.expenseMinor).toBe(100000);
    expect(afterRes.body.expenseFormatted).toBe('฿1,000.00');
  });

  it('TEST-F07-05 / AC-F07-05: Exclusion of opening balances from income totals (BR-05, D-14)', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;

    // Record 50,000.00 THB opening balance
    await request(app)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie)
      .send({
        accountId: bank.id,
        amountMinor: 5000000,
        date: '2026-10-20',
        description: 'Bank opening balance'
      });

    const summaryRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.incomeMinor).toBe(0);
    expect(summaryRes.body.incomeFormatted).toBe('฿0.00');
    expect(summaryRes.body.expenseMinor).toBe(0);
    expect(summaryRes.body.netMinor).toBe(0);
  });

  it('TEST-F07-06 / AC-F07-06: Strict cross-user privacy isolation on history and summary (BR-10, D-15)', async () => {
    const { cookie: user1Cookie, user: user1 } = await loginAs('demo.user1@example.test');
    const { cookie: user2Cookie, user: user2 } = await loginAs('demo.user2@example.test');

    const u1Accounts = await prisma.account.findMany({ where: { userId: user1.id } });
    const u1Bank = u1Accounts.find((a) => a.name === 'Main Bank Account')!;
    const u1Salary = u1Accounts.find((a) => a.name === 'Salary')!;

    const u2Accounts = await prisma.account.findMany({ where: { userId: user2.id } });
    const u2Bank = u2Accounts.find((a) => a.name === 'Main Bank Account')!;
    const u2Salary = u2Accounts.find((a) => a.name === 'Salary')!;

    // User 1 records 10,000 THB receipt
    await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', user1Cookie)
      .send({
        mainAccountId: u1Bank.id,
        totalMinor: 1000000,
        transactionDate: '2026-10-20',
        description: 'User 1 Salary',
        allocations: [{ targetAccountId: u1Salary.id, amountMinor: 1000000 }]
      });

    // User 2 records 50,000 THB receipt
    const u2Tx = await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', user2Cookie)
      .send({
        mainAccountId: u2Bank.id,
        totalMinor: 5000000,
        transactionDate: '2026-10-21',
        description: 'User 2 Huge Bonus',
        allocations: [{ targetAccountId: u2Salary.id, amountMinor: 5000000 }]
      });

    // 1. User 1 queries transactions: must contain only User 1 transaction
    const u1History = await request(app)
      .get('/api/transactions')
      .set('Cookie', user1Cookie);

    expect(u1History.status).toBe(200);
    expect(u1History.body.pagination.totalCount).toBe(1);
    expect(u1History.body.transactions[0].description).toBe('User 1 Salary');

    // 2. User 1 queries summary: must calculate only User 1 income (10,000 THB, not 60,000)
    const u1Summary = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', user1Cookie);

    expect(u1Summary.status).toBe(200);
    expect(u1Summary.body.incomeMinor).toBe(1000000);
    expect(u1Summary.body.incomeFormatted).toBe('฿10,000.00');

    // 3. User 1 attempts to fetch User 2's transaction detail by ID -> 404 (BR-10, D-15)
    const crossTxRes = await request(app)
      .get(`/api/transactions/${u2Tx.body.transaction.id}`)
      .set('Cookie', user1Cookie);

    expect(crossTxRes.status).toBe(404);
    expect(crossTxRes.body.error.code).toBe('TRANSACTION_NOT_FOUND');
  });

  it('filters summary calculation across specified date ranges', async () => {
    const { cookie, user } = await loginAs('demo.user1@example.test');

    const accounts = await prisma.account.findMany({ where: { userId: user.id } });
    const bank = accounts.find((a) => a.name === 'Main Bank Account')!;
    const salary = accounts.find((a) => a.name === 'Salary')!;

    // September receipt: 10,000 THB
    await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 1000000,
        transactionDate: '2026-09-30',
        description: 'September Salary',
        allocations: [{ targetAccountId: salary.id, amountMinor: 1000000 }]
      });

    // October receipt: 25,000 THB
    await request(app)
      .post('/api/transactions/receipt')
      .set('Cookie', cookie)
      .send({
        mainAccountId: bank.id,
        totalMinor: 2500000,
        transactionDate: '2026-10-15',
        description: 'October Salary',
        allocations: [{ targetAccountId: salary.id, amountMinor: 2500000 }]
      });

    // 1. All-time summary -> 35,000 THB
    const allRes = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', cookie);
    expect(allRes.body.incomeMinor).toBe(3500000);

    // 2. Filter October only
    const octRes = await request(app)
      .get('/api/summary/income-expense?fromDate=2026-10-01&toDate=2026-10-31')
      .set('Cookie', cookie);
    expect(octRes.body.incomeMinor).toBe(2500000);
    expect(octRes.body.incomeFormatted).toBe('฿25,000.00');

    // 3. Filter September only
    const sepRes = await request(app)
      .get('/api/summary/income-expense?fromDate=2026-09-01&toDate=2026-09-30')
      .set('Cookie', cookie);
    expect(sepRes.body.incomeMinor).toBe(1000000);
    expect(sepRes.body.incomeFormatted).toBe('฿10,000.00');

    // 4. Invalid date format -> 400 Bad Request
    const badDateRes = await request(app)
      .get('/api/summary/income-expense?fromDate=invalid-date')
      .set('Cookie', cookie);
    expect(badDateRes.status).toBe(400);
    expect(badDateRes.body.error.code).toBe('INVALID_DATE');

    // 5. Inverted date range -> 400 Bad Request
    const invertedRes = await request(app)
      .get('/api/summary/income-expense?fromDate=2026-10-31&toDate=2026-10-01')
      .set('Cookie', cookie);
    expect(invertedRes.status).toBe(400);
    expect(invertedRes.body.error.code).toBe('INVALID_DATE_RANGE');
  });

  it('enforces authentication (401) and administrator restrictions (403) per BR-16 and NFR-01', async () => {
    // 1. Unauthenticated requests
    const unauthHistory = await request(app).get('/api/transactions');
    expect(unauthHistory.status).toBe(401);

    const unauthSummary = await request(app).get('/api/summary/income-expense');
    expect(unauthSummary.status).toBe(401);

    // 2. Administrator requests
    const { cookie: adminCookie } = await loginAs('demo.admin@example.test');

    const adminHistory = await request(app)
      .get('/api/transactions')
      .set('Cookie', adminCookie);
    expect(adminHistory.status).toBe(403);

    const adminSummary = await request(app)
      .get('/api/summary/income-expense')
      .set('Cookie', adminCookie);
    expect(adminSummary.status).toBe(403);
  });

  it('serves overview page containing the summary widget and transaction history table (NFR-10)', async () => {
    const { cookie } = await loginAs('demo.user1@example.test');

    const res = await request(app)
      .get('/overview')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Income &amp; Expense Period Summary');
    expect(res.text).toContain('summaryIncome');
    expect(res.text).toContain('summaryExpense');
    expect(res.text).toContain('summaryNet');
    expect(res.text).toContain('summaryFromDate');
    expect(res.text).toContain('summaryToDate');
    expect(res.text).toContain('Transaction History');
    expect(res.text).toContain('historyTableContainer');
    expect(res.text).toContain('historyTableBody');
    expect(res.text).toContain('historyPaginationInfo');
    expect(res.text).toContain('btnPrevHistoryPage');
    expect(res.text).toContain('btnNextHistoryPage');
  });
});

