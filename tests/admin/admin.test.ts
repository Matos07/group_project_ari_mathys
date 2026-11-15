import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';
import { requireAuth, requireRole } from '../../src/middleware/auth.js';

describe('F-02: Administrator User Management & Access Control', () => {
  const seedPassword = 'ValidTestPassword123!';
  const app = createApp((router) => {
    // Financial endpoint requiring USER role (mirrors accounts & transactions)
    router.get('/api/accounts', requireAuth, requireRole('USER'), (_req, res) => {
      res.json({ accounts: [] });
    });
  });

  beforeAll(async () => {
    await seedDatabase(prisma, seedPassword);
  });

  beforeEach(async () => {
    // Delete any temporary users created during tests
    await prisma.user.deleteMany({
      where: { email: { notIn: ['demo.admin@example.test', 'demo.user1@example.test', 'demo.user2@example.test'] } }
    });
    // Ensure all seed users are active and reset sessions
    await prisma.user.updateMany({
      data: { isActive: true }
    });
    await prisma.session.deleteMany();
  });

  async function loginAs(email: string): Promise<string[]> {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: seedPassword });
    return res.headers['set-cookie'];
  }

  it('TEST-F02-01 / AC-F02-01: Admin can list platform users without financial data (FR-05)', async () => {
    const adminCookies = await loginAs('demo.admin@example.test');

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.users).toBeInstanceOf(Array);
    expect(res.body.users.length).toBeGreaterThanOrEqual(3);

    // Verify fields returned strictly exclude financial records, balances, or passwordHash
    for (const u of res.body.users) {
      expect(u.id).toBeDefined();
      expect(u.email).toBeDefined();
      expect(u.displayName).toBeDefined();
      expect(u.role).toBeDefined();
      expect(typeof u.isActive).toBe('boolean');
      expect(u.createdAt).toBeDefined();

      // Invariants: zero leakage of passwords or financial data
      expect(u.passwordHash).toBeUndefined();
      expect(u.accounts).toBeUndefined();
      expect(u.transactions).toBeUndefined();
      expect(u.balanceMinor).toBeUndefined();
    }
  });

  it('TEST-F02-02 / AC-F02-02: Regular user receives 403 Forbidden when requesting admin user list', async () => {
    const userCookies = await loginAs('demo.user1@example.test');

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', userCookies);

    expect(res.status).toBe(403);
    expect(res.body.error).toEqual({
      code: 'FORBIDDEN',
      message: expect.any(String)
    });
  });

  it('TEST-F02-03 / AC-F02-03: Admin can disable a regular user account (FR-06)', async () => {
    const adminCookies = await loginAs('demo.admin@example.test');
    const user = await prisma.user.findUnique({ where: { email: 'demo.user1@example.test' } });

    const res = await request(app)
      .patch(`/api/admin/users/${user!.id}/status`)
      .set('Cookie', adminCookies)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: user!.id,
      isActive: false
    });

    // Check DB status
    const updated = await prisma.user.findUnique({ where: { id: user!.id } });
    expect(updated?.isActive).toBe(false);
  });

  it('TEST-F02-04 / AC-F02-04: Disabling a user immediately revokes all active sessions (BR-17)', async () => {
    // 1. User 1 logs in and receives a valid session
    const userCookies = await loginAs('demo.user1@example.test');

    // Confirm session is active
    const meResBefore = await request(app)
      .get('/api/auth/me')
      .set('Cookie', userCookies);
    expect(meResBefore.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { email: 'demo.user1@example.test' } });
    const userSessionsBefore = await prisma.session.count({ where: { userId: user!.id } });
    expect(userSessionsBefore).toBe(1);

    // 2. Admin disables User 1
    const adminCookies = await loginAs('demo.admin@example.test');
    const disableRes = await request(app)
      .patch(`/api/admin/users/${user!.id}/status`)
      .set('Cookie', adminCookies)
      .send({ isActive: false });
    expect(disableRes.status).toBe(200);

    // Verify session rows were deleted from the database
    const userSessionsAfter = await prisma.session.count({ where: { userId: user!.id } });
    expect(userSessionsAfter).toBe(0);

    // 3. User 1 attempts subsequent authenticated request -> 401 UNAUTHENTICATED
    const meResAfter = await request(app)
      .get('/api/auth/me')
      .set('Cookie', userCookies);
    expect(meResAfter.status).toBe(401);
    expect(meResAfter.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('TEST-F02-05 / AC-F02-05: Admin cannot disable self when multiple admins exist (BR-18)', async () => {
    // Create a second active admin so it is not a "last admin" condition
    const secondAdmin = await prisma.user.create({
      data: {
        email: 'second.admin@example.test',
        passwordHash: bcrypt.hashSync(seedPassword, 12),
        displayName: 'Second Admin',
        role: 'ADMINISTRATOR',
        isActive: true
      }
    });

    const adminCookies = await loginAs('demo.admin@example.test');
    const admin = await prisma.user.findUnique({ where: { email: 'demo.admin@example.test' } });

    // Admin attempts to disable self
    const res = await request(app)
      .patch(`/api/admin/users/${admin!.id}/status`)
      .set('Cookie', adminCookies)
      .send({ isActive: false });

    expect(res.status).toBe(422);
    expect(res.body.error).toEqual({
      code: 'CANNOT_DISABLE_SELF',
      message: 'An administrator cannot disable their own account'
    });

    // Verify admin is still active
    const refreshed = await prisma.user.findUnique({ where: { id: admin!.id } });
    expect(refreshed?.isActive).toBe(true);
  });

  it('TEST-F02-06 / AC-F02-06: Admin cannot disable the last active administrator (BR-18)', async () => {
    // Only 1 admin in system (demo.admin@example.test)
    const admin = await prisma.user.findUnique({ where: { email: 'demo.admin@example.test' } });
    const adminCookies = await loginAs('demo.admin@example.test');

    const res = await request(app)
      .patch(`/api/admin/users/${admin!.id}/status`)
      .set('Cookie', adminCookies)
      .send({ isActive: false });

    expect(res.status).toBe(422);
    expect(res.body.error).toEqual({
      code: 'CANNOT_DISABLE_LAST_ADMIN',
      message: 'Cannot disable the last active administrator'
    });

    // Check DB status: still active
    const refreshed = await prisma.user.findUnique({ where: { id: admin!.id } });
    expect(refreshed?.isActive).toBe(true);
  });

  it('TEST-F02-07: Admin can enable a previously disabled user (FR-06)', async () => {
    const adminCookies = await loginAs('demo.admin@example.test');
    const user = await prisma.user.findUnique({ where: { email: 'demo.user1@example.test' } });

    // First disable
    await request(app)
      .patch(`/api/admin/users/${user!.id}/status`)
      .set('Cookie', adminCookies)
      .send({ isActive: false });

    // Now re-enable
    const res = await request(app)
      .patch(`/api/admin/users/${user!.id}/status`)
      .set('Cookie', adminCookies)
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: user!.id,
      isActive: true
    });

    const refreshed = await prisma.user.findUnique({ where: { id: user!.id } });
    expect(refreshed?.isActive).toBe(true);
  });

  it('TEST-F02-08 / BR-16: Admin receives 403 Forbidden when invoking financial routes', async () => {
    const adminCookies = await loginAs('demo.admin@example.test');

    const res = await request(app)
      .get('/api/accounts')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('TEST-F02-09: GET /admin/users serves HTML dashboard UI with identity and logout controls', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Admin Dashboard');
    expect(res.text).toContain('Users');
    expect(res.text).toContain('adminUserInfo');
    expect(res.text).toContain('btnAdminLogout');
    expect(res.text).toContain('handleAdminLogout');
  });
});
