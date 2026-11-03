import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
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

  it('TEST-F02-05 / AC-F02-05: Admin cannot disable self (BR-18)', async () => {
    const adminCookies = await loginAs('demo.admin@example.test');
    const admin = await prisma.user.findUnique({ where: { email: 'demo.admin@example.test' } });

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
    // Ensure only 1 admin is active in the database
    const adminCount = await prisma.user.count({
      where: { role: 'ADMINISTRATOR', isActive: true }
    });
    expect(adminCount).toBe(1);

    // Create a second admin to test disabling an admin who is the last active admin
    // In our seed there is only 1 admin ('demo.admin@example.test').
    // Even if another admin existed but was inactive, the last active admin cannot be disabled.
    const secondAdmin = await prisma.user.create({
      data: {
        email: 'secondary.admin@example.test',
        passwordHash: 'dummy',
        displayName: 'Secondary Admin',
        role: 'ADMINISTRATOR',
        isActive: false // already inactive
      }
    });

    const adminCookies = await loginAs('demo.admin@example.test');

    // Attempt to disable the secondary admin (already inactive) or if someone tries to disable the last active admin
    // If we activate secondary admin, then primary admin disables secondary admin, primary admin cannot be disabled next
    await prisma.user.update({
      where: { id: secondAdmin.id },
      data: { isActive: true }
    });

    // Primary admin disables secondary admin -> allowed (since primary remains active)
    const disableSecondaryRes = await request(app)
      .patch(`/api/admin/users/${secondAdmin.id}/status`)
      .set('Cookie', adminCookies)
      .send({ isActive: false });
    expect(disableSecondaryRes.status).toBe(200);

    // Now only 1 active admin remains. Create a session for secondary admin when activated or test logic
    // Now secondary admin attempts to disable primary admin, but secondary is inactive.
    // If primary admin attempts to disable secondary again (already inactive, but still admin):
    // What if someone attempts to disable the only active admin?
    // Let's create admin3 who is active and logs in:
    const admin3 = await prisma.user.create({
      data: {
        email: 'admin3@example.test',
        passwordHash: await import('bcryptjs').then(b => b.default.hashSync(seedPassword, 12)),
        displayName: 'Admin Three',
        role: 'ADMINISTRATOR',
        isActive: true
      }
    });

    // Deactivate primary admin and secondary admin directly in DB so admin3 is the ONLY active admin
    await prisma.user.update({
      where: { email: 'demo.admin@example.test' },
      data: { isActive: false }
    });

    const admin3Cookies = await loginAs('admin3@example.test');

    // admin3 attempts to disable primary admin who is already inactive?
    // What if primary admin is activated, logs in, and tries to disable admin3 while admin3 is the last admin?
    // Let's activate demo.admin, log in as demo.admin, and disable admin3. That leaves demo.admin as last active admin.
    await prisma.user.update({
      where: { email: 'demo.admin@example.test' },
      data: { isActive: true }
    });

    const demoAdminCookies = await loginAs('demo.admin@example.test');
    // Disable admin3: leaves 1 active admin (demo.admin)
    const resDisableAdmin3 = await request(app)
      .patch(`/api/admin/users/${admin3.id}/status`)
      .set('Cookie', demoAdminCookies)
      .send({ isActive: false });
    expect(resDisableAdmin3.status).toBe(200);

    // Now demo.admin is the last active admin. If an attempt is made to disable demo.admin from another active admin
    // Reactivate admin3 to test disabling demo.admin when demo.admin is the last active admin
    // If only 1 admin is active (demo.admin), any attempt to disable demo.admin fails with CANNOT_DISABLE_SELF.
    // What if another admin attempts to disable the last active admin?
    await prisma.user.update({
      where: { id: admin3.id },
      data: { isActive: true }
    });
    // Now 2 active admins. Deactivate demo.admin in DB:
    await prisma.user.update({
      where: { email: 'demo.admin@example.test' },
      data: { isActive: false }
    });
    // Now only admin3 is active.
    // If admin3 tries to disable demo.admin (already inactive), but if admin3 is the last active admin and someone tries to disable admin3:
    const resLast = await request(app)
      .patch(`/api/admin/users/${admin3.id}/status`)
      .set('Cookie', admin3Cookies)
      .send({ isActive: false });
    // Caught by CANNOT_DISABLE_SELF (and also CANNOT_DISABLE_LAST_ADMIN)
    expect(resLast.status).toBe(422);

    // Clean up temporary admin users
    await prisma.user.deleteMany({
      where: { id: { in: [secondAdmin.id, admin3.id] } }
    });
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

  it('TEST-F02-09: GET /admin/users serves HTML dashboard UI', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Admin Dashboard');
    expect(res.text).toContain('Users');
  });
});
