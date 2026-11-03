import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { seedDatabase } from '../../prisma/seed.js';
import { requireAuth, requireRole } from '../../src/middleware/auth.js';

describe('F-01: Authentication, Sessions, and Role-Based Access Control', () => {
  const seedPassword = 'ValidTestPassword123!';
  const app = createApp((router) => {
    // Protected test route requiring USER role (mirrors financial endpoints)
    router.get('/api/test-protected-user', requireAuth, requireRole('USER'), (req, res) => {
      res.json({ message: 'User access granted', userId: req.user?.id });
    });

    // Protected test route requiring ADMINISTRATOR role (mirrors admin endpoints)
    router.get('/api/test-protected-admin', requireAuth, requireRole('ADMINISTRATOR'), (req, res) => {
      res.json({ message: 'Admin access granted', adminId: req.user?.id });
    });

    // Route demonstrating data ownership isolation (BR-10, D-15)
    router.get('/api/accounts/:id', requireAuth, async (req, res) => {
      const account = await prisma.account.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!account) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Account not found'
          }
        });
        return;
      }

      res.json({ account });
    });
  });

  beforeAll(async () => {
    await seedDatabase(prisma, seedPassword);
  });

  beforeEach(async () => {
    // Reset any deactivated users and clean up sessions
    await prisma.user.updateMany({
      data: { isActive: true }
    });
    await prisma.session.deleteMany();
  });

  it('TEST-F01-01 / AC-F01-01: Valid user login returns user info and sets httpOnly sid cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: seedPassword });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: expect.any(String),
      email: 'demo.user1@example.test',
      displayName: 'User One',
      role: 'USER'
    });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sidCookie = cookies.find((c: string) => c.startsWith('sid='));
    expect(sidCookie).toBeDefined();
    expect(sidCookie).toContain('HttpOnly');

    // Verify session row exists in DB with 8-hour lifetime
    const dbSession = await prisma.session.findFirst({
      where: { userId: res.body.user.id }
    });
    expect(dbSession).not.toBeNull();
    const now = Date.now();
    const expiry = new Date(dbSession!.expiresAt).getTime();
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(7.9);
    expect(diffHours).toBeLessThanOrEqual(8.1);
  });

  it('TEST-F01-02 / AC-F01-02: Invalid password returns 401 with generic error message (BR-21)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });

    const sessions = await prisma.session.findMany();
    expect(sessions).toHaveLength(0);
  });

  it('TEST-F01-03 / AC-F01-03: Non-existent email returns identical generic 401 error (BR-21)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.test', password: seedPassword });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  });

  it('TEST-F01-04 / AC-F01-04: Disabled user account is rejected on login with generic 401 (BR-17, BR-21)', async () => {
    await prisma.user.update({
      where: { email: 'demo.user1@example.test' },
      data: { isActive: false }
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: seedPassword });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  });

  it('TEST-F01-05 / AC-F01-05: Current user identity endpoint GET /api/auth/me returns identity with valid cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: seedPassword });

    const cookie = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toEqual({
      id: loginRes.body.user.id,
      email: 'demo.user1@example.test',
      displayName: 'User One',
      role: 'USER'
    });
  });

  it('TEST-F01-06 / AC-F01-06: Logout revokes session server-side and clears cookie (FR-02, NFR-05)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: seedPassword });

    const cookie = loginRes.headers['set-cookie'];

    // Session exists in DB
    const sessionCountBefore = await prisma.session.count();
    expect(sessionCountBefore).toBe(1);

    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({ message: 'Logged out successfully' });

    // Session deleted from DB
    const sessionCountAfter = await prisma.session.count();
    expect(sessionCountAfter).toBe(0);

    // Reuse old cookie -> 401 UNAUTHENTICATED
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(401);
    expect(meRes.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('TEST-F01-07 / AC-F01-07: Expired session returns 401 Unauthorized (NFR-05)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: seedPassword });

    const cookie = loginRes.headers['set-cookie'];

    // Manually expire the session in the database
    await prisma.session.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) }
    });

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(401);
    expect(meRes.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('TEST-F01-08 / AC-F01-08: Protected routes return 401 when accessed unauthenticated (NFR-01)', async () => {
    const resMe = await request(app).get('/api/auth/me');
    expect(resMe.status).toBe(401);
    expect(resMe.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required'
      }
    });

    const resUserRoute = await request(app).get('/api/test-protected-user');
    expect(resUserRoute.status).toBe(401);
    expect(resUserRoute.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required'
      }
    });
  });

  it('TEST-F01-09 / AC-F01-09: Admin role cannot access USER routes (BR-16) and USER cannot access ADMIN routes', async () => {
    // 1. Admin login
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.admin@example.test', password: seedPassword });

    const adminCookie = adminLoginRes.headers['set-cookie'];

    // Admin attempts to access user route -> 403 Forbidden
    const adminOnUserRoute = await request(app)
      .get('/api/test-protected-user')
      .set('Cookie', adminCookie);

    expect(adminOnUserRoute.status).toBe(403);
    expect(adminOnUserRoute.body.error.code).toBe('FORBIDDEN');

    // Admin can access admin route -> 200 OK
    const adminOnAdminRoute = await request(app)
      .get('/api/test-protected-admin')
      .set('Cookie', adminCookie);

    expect(adminOnAdminRoute.status).toBe(200);

    // 2. Regular user login
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: seedPassword });

    const userCookie = userLoginRes.headers['set-cookie'];

    // User attempts to access admin route -> 403 Forbidden
    const userOnAdminRoute = await request(app)
      .get('/api/test-protected-admin')
      .set('Cookie', userCookie);

    expect(userOnAdminRoute.status).toBe(403);
    expect(userOnAdminRoute.body.error.code).toBe('FORBIDDEN');
  });

  it('TEST-F01-10 / AC-F01-10: Cross-user privacy isolation returns 404 for foreign resource (BR-10, D-15)', async () => {
    // Find an account belonging to User 2
    const user2 = await prisma.user.findUnique({
      where: { email: 'demo.user2@example.test' },
      include: { accounts: true }
    });
    const user2AccountId = user2!.accounts[0].id;

    // Login as User 1
    const user1LoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.user1@example.test', password: seedPassword });

    const user1Cookie = user1LoginRes.headers['set-cookie'];

    // User 1 attempts to access User 2's account
    const res = await request(app)
      .get(`/api/accounts/${user2AccountId}`)
      .set('Cookie', user1Cookie);

    // Must return 404 Not Found to prevent leaking resource existence
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Account not found'
      }
    });
  });
});

