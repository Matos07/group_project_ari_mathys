import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';

export type UserRole = 'USER' | 'ADMINISTRATOR';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

/**
 * Validates the session cookie against the database.
 * Enforces absolute session expiry (NFR-05) and active user status (BR-17).
 * Rejects unauthenticated requests with 401 (NFR-01).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.signedCookies?.sid || req.cookies?.sid;

  if (!sessionId || typeof sessionId !== 'string') {
    res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required'
      }
    });
    return;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Check session expiration (8-hour absolute lifetime, D-04, NFR-05)
    if (session.expiresAt <= new Date()) {
      // Clean up expired session asynchronously
      prisma.session.delete({ where: { id: sessionId } }).catch(() => {});

      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Check if user account is disabled (BR-17)
    if (!session.user.isActive) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role as UserRole
    };
    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware.
 * Enforces that req.user matches one of the allowed roles.
 * Returns 403 Forbidden on role mismatch (FR-04, BR-16).
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: insufficient permissions'
        }
      });
      return;
    }

    next();
  };
}

