import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { MAX_TRANSACTION_AMOUNT_MINOR } from '../domain/ledger/index.js';

export const transactionsRouter = Router();

// Financial endpoints require role USER (BR-16, FR-04)
transactionsRouter.use(requireAuth, requireRole('USER'));

/**
 * POST /api/transactions/opening-balance
 * Records an initial balance on a Cash, Loan Taken, or Loan Given account.
 * Implements F-04, FR-11, BR-02, BR-12, D-08, D-14, AC-F04-01..05.
 */
transactionsRouter.post(
  '/opening-balance',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { accountId, amountMinor, date, description } = req.body ?? {};

      // 1. Input presence & type validation (BR-02, AC-F04-04)
      if (!accountId || typeof accountId !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'accountId is required'
          }
        });
        return;
      }

      if (
        amountMinor === undefined ||
        typeof amountMinor !== 'number' ||
        !Number.isInteger(amountMinor) ||
        amountMinor <= 0
      ) {
        res.status(400).json({
          error: {
            code: 'INVALID_AMOUNT',
            message: 'amountMinor must be a positive integer in minor units (satang)'
          }
        });
        return;
      }

      if (amountMinor > MAX_TRANSACTION_AMOUNT_MINOR) {
        res.status(400).json({
          error: {
            code: 'AMOUNT_EXCEEDS_MAX',
            message: `amountMinor cannot exceed ${MAX_TRANSACTION_AMOUNT_MINOR} minor units (10,000,000.00 THB)`
          }
        });
        return;
      }

      // Date validation
      let transactionDate: string;
      if (date !== undefined && date !== null && String(date).trim() !== '') {
        const dateStr = String(date).trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr) || isNaN(Date.parse(dateStr))) {
          res.status(400).json({
            error: {
              code: 'INVALID_DATE',
              message: 'date must be a valid date in YYYY-MM-DD format'
            }
          });
          return;
        }
        transactionDate = dateStr;
      } else {
        transactionDate = new Date().toISOString().slice(0, 10);
      }

      // 2. Account existence and privacy isolation (BR-10, D-15)
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account || account.userId !== userId) {
        res.status(404).json({
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        });
        return;
      }

      // 3. Target account type validation (BR-12, AC-F04-02)
      // Opening balances can only apply to CASH, LOAN_TAKEN, or LOAN_GIVEN
      const allowedTypes = ['CASH', 'LOAN_TAKEN', 'LOAN_GIVEN'];
      if (!allowedTypes.includes(account.type)) {
        res.status(422).json({
          error: {
            code: 'INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE',
            message: 'Opening balance can only apply to Cash, Loan Taken, or Loan Given accounts'
          }
        });
        return;
      }

      // 4. In Sprint 1, at most one opening balance is allowed per account (BR-12, AC-F04-03)
      const existingOpeningBalance = await prisma.transaction.findFirst({
        where: {
          userId,
          mainAccountId: account.id,
          kind: 'OPENING_BALANCE'
        }
      });

      if (existingOpeningBalance) {
        res.status(422).json({
          error: {
            code: 'OPENING_BALANCE_EXISTS',
            message: 'An opening balance has already been recorded for this account'
          }
        });
        return;
      }

      // 5. Create transaction row (no allocation lines per D-08, D-14)
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          kind: 'OPENING_BALANCE',
          mainAccountId: account.id,
          totalMinor: amountMinor,
          transactionDate,
          description: description !== undefined && description !== null ? String(description).trim() : ''
        }
      });

      // 6. Return 201 Created
      res.status(201).json({
        transaction: {
          id: transaction.id,
          kind: transaction.kind,
          mainAccountId: transaction.mainAccountId,
          totalMinor: transaction.totalMinor,
          transactionDate: transaction.transactionDate,
          description: transaction.description
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

