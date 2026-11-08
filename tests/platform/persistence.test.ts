import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';

describe('TEST-SR02-05 / NFR-07: Persistent Storage Durability & Application Restart', () => {
  it('should persist committed records across database client disconnect and reconnect', async () => {
    const client1 = new PrismaClient();
    const testEmail = `durability-test-${Date.now()}@example.test`;

    const createdUser = await client1.user.create({
      data: {
        email: testEmail,
        passwordHash: '$2a$12$e8Yh9Y6Yk8o1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c',
        displayName: 'Durability User',
        role: 'USER',
        isActive: true
      }
    });

    expect(createdUser.id).toBeDefined();
    await client1.$disconnect();

    // Reconnect with a fresh client instance simulating app restart
    const client2 = new PrismaClient();
    const retrievedUser = await client2.user.findUnique({
      where: { id: createdUser.id }
    });

    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.email).toBe(testEmail);
    expect(retrievedUser?.displayName).toBe('Durability User');

    // Clean up
    await client2.user.delete({
      where: { id: createdUser.id }
    });
    await client2.$disconnect();
  });

  it('TEST-NFR07-01: committed financial transactions and derived balances survive complete application restart', async () => {
    // 1. Initial application lifecycle instance
    const app1 = createApp();
    const testPassword = 'Password123!';
    await prisma.allocationLine.deleteMany({});
    await prisma.transaction.deleteMany({});
    await seedDatabase(prisma, testPassword);

    const loginRes1 = await request(app1)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: testPassword });
    const cookie1 = loginRes1.headers['set-cookie'];
    const user1 = loginRes1.body.user;

    const accounts1 = await prisma.account.findMany({ where: { userId: user1.id } });
    const bank1 = accounts1.find((a) => a.name === 'Main Bank Account')!;

    const payload = {
      accountId: bank1.id,
      amountMinor: 2500000, // 25,000.00 THB
      date: '2026-10-23',
      description: 'Opening balance before restart'
    };

    const txRes = await request(app1)
      .post('/api/transactions/opening-balance')
      .set('Cookie', cookie1)
      .send(payload);

    expect(txRes.status).toBe(201);
    const createdTxId = txRes.body.transaction.id;

    // Simulate complete application shutdown: disconnect DB client and destroy app1
    await prisma.$disconnect();

    // 2. Simulate application restart: reconnect and boot completely fresh application instance
    await prisma.$connect();
    const app2 = createApp();

    const loginRes2 = await request(app2)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: testPassword });
    const cookie2 = loginRes2.headers['set-cookie'];

    // Verify transaction history persisted exactly across restart
    const historyRes = await request(app2)
      .get('/api/transactions')
      .set('Cookie', cookie2);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.transactions).toHaveLength(1);
    expect(historyRes.body.transactions[0].id).toBe(createdTxId);
    expect(historyRes.body.transactions[0].totalMinor).toBe(2500000);

    // Verify derived account balance persisted exactly across restart
    const accountsRes = await request(app2)
      .get('/api/accounts')
      .set('Cookie', cookie2);

    expect(accountsRes.status).toBe(200);
    const bankAfterRestart = accountsRes.body.accounts.find((a: any) => a.id === bank1.id);
    expect(bankAfterRestart.balanceMinor).toBe(2500000);
    expect(bankAfterRestart.balanceFormatted).toBe('฿25,000.00');
  });
});
