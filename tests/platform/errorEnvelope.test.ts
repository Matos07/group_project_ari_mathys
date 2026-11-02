import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { AppError } from '../../src/errors/AppError.js';

describe('TEST-SR02-04: Error Envelope Hygiene & Formatting', () => {
  it('should return standardized 404 envelope for non-existent route with no stack trace', async () => {
    const app = createApp();
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
    expect(res.body.stack).toBeUndefined();
    expect(res.body.error.stack).toBeUndefined();
  });

  it('should return standardized 500 envelope without leaking stack traces or internals on unhandled exception', async () => {
    const app = createApp();
    app.get('/api/test-crash', () => {
      throw new Error('Database connection failed: SELECT * FROM users at C:\\server\\secret.ts');
    });

    const res = await request(app).get('/api/test-crash');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
    expect(res.body.stack).toBeUndefined();
    expect(res.body.error.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('SELECT');
    expect(JSON.stringify(res.body)).not.toContain('secret.ts');
  });

  it('should format domain/application errors with custom code, message and optional details', async () => {
    const app = createApp();
    app.get('/api/test-app-error', () => {
      throw new AppError(422, 'OVERDRAFT_DISALLOWED', 'Cash account balance cannot become negative', {
        accountId: 'acc-123',
        attemptedMinor: 5000
      });
    });

    const res = await request(app).get('/api/test-app-error');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      error: {
        code: 'OVERDRAFT_DISALLOWED',
        message: 'Cash account balance cannot become negative',
        details: {
          accountId: 'acc-123',
          attemptedMinor: 5000
        }
      }
    });
    expect(res.body.stack).toBeUndefined();
  });
});
