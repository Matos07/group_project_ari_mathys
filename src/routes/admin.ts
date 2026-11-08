import { Router } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

// Apply auth and admin role requirements to all admin API routes (FR-04, BR-16)
adminRouter.use(requireAuth, requireRole('ADMINISTRATOR'));

/**
 * GET /api/admin/users
 * Returns list of platform users without financial data (FR-05).
 */
adminRouter.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Enables or disables a user account (FR-06).
 * Enforces BR-17 (session revocation on disable) and BR-18 (admin self & last-admin protection).
 */
adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { isActive } = req.body ?? {};

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Field isActive must be a boolean'
        }
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Protection rules when disabling an account (BR-18)
    if (isActive === false) {
      // 1. Cannot disable last active administrator (BR-18, AC-F02-06)
      if (targetUser.role === 'ADMINISTRATOR' && targetUser.isActive) {
        const activeAdminCount = await prisma.user.count({
          where: { role: 'ADMINISTRATOR', isActive: true }
        });

        if (activeAdminCount <= 1) {
          res.status(422).json({
            error: {
              code: 'CANNOT_DISABLE_LAST_ADMIN',
              message: 'Cannot disable the last active administrator'
            }
          });
          return;
        }
      }

      // 2. Cannot disable self (BR-18, AC-F02-05)
      if (targetUserId === req.user!.id) {
        res.status(422).json({
          error: {
            code: 'CANNOT_DISABLE_SELF',
            message: 'An administrator cannot disable their own account'
          }
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive }
    });

    // When disabling a user, immediately revoke all their active sessions (BR-17)
    if (isActive === false) {
      await prisma.session.deleteMany({
        where: { userId: targetUserId }
      });
    }

    res.status(200).json({
      id: updatedUser.id,
      isActive: updatedUser.isActive
    });
  } catch (error) {
    next(error);
  }
});
