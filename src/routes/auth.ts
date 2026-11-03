import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours absolute lifetime (D-04, NFR-05)

/**
 * POST /api/auth/login
 * Authenticates user credentials with constant generic error message (BR-21).
 * Issues an httpOnly, SameSite=Lax signed session cookie (FR-01).
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    const genericError = {
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    };

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(401).json(genericError);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      res.status(401).json(genericError);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json(genericError);
      return;
    }

    // Inactive account check after password validation (BR-17, BR-21)
    if (!user.isActive) {
      res.status(401).json(genericError);
      return;
    }

    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt
      }
    });

    res.cookie('sid', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_LIFETIME_MS,
      signed: true
    });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Deletes session from the database and clears the sid cookie (FR-02, NFR-05).
 */
authRouter.post('/logout', async (req, res, next) => {
  try {
    const sessionId = req.signedCookies?.sid || req.cookies?.sid;

    if (sessionId && typeof sessionId === 'string') {
      await prisma.session.deleteMany({
        where: { id: sessionId }
      });
    }

    res.clearCookie('sid', { path: '/' });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user identity (FR-03).
 */
authRouter.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    user: req.user
  });
});

